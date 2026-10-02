import { firebaseConfig } from './firebase-config.js';
import { categories, seedQuestions } from './questions';
import { selectQuestion, requireCurrentRound, validateContent, validateJoin } from './game-logic.mjs';
export const configured = !!firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('COLE_') && !firebaseConfig.projectId.includes('SEU_');
let clientPromise;
async function client() {
    if (!configured)
        throw new Error('Configure src/firebase-config.js com os dados do seu projeto Firebase. Consulte o README.');
    if (!clientPromise) {
        clientPromise = (async () => {
            // SDK modular oficial do Firebase, carregado diretamente da CDN do Google.
            const base = 'https://www.gstatic.com/firebasejs/12.19.0/';
            const [appSdk, authSdk, firestoreSdk] = await Promise.all([
                import(/* @vite-ignore */ base + 'firebase-app.js'),
                import(/* @vite-ignore */ base + 'firebase-auth.js'),
                import(/* @vite-ignore */ base + 'firebase-firestore.js')
            ]);
            const app = appSdk.initializeApp(firebaseConfig), auth = authSdk.getAuth(app), db = firestoreSdk.getFirestore(app);
            await authSdk.setPersistence(auth, authSdk.browserLocalPersistence);
            return { auth, db, a: authSdk, f: firestoreSdk };
        })().catch(error => { clientPromise = undefined; throw error; });
    }
    return clientPromise;
}
function categoryValid(v) { return v === 'all' || categories.some(c => c.id === v); }
function signed(auth) { if (!auth.currentUser)
    throw new Error('Entre na sua conta para jogar.'); return auth.currentUser.uid; }
async function member(c, roomId) { const ref = c.f.doc(c.db, 'rooms', roomId), snapshot = await c.f.getDoc(ref); if (!snapshot.exists())
    throw new Error('Sala não encontrada.'); const room = snapshot.data(); if (!room.memberIds.includes(signed(c.auth)))
    throw new Error('Você não faz parte desta sala.'); return { room, ref }; }
function roomState(roomId, room, questions, rounds, uid) {
    const people = [{ name: room.ownerName, slot: 1, user_id: room.ownerId }, ...(room.guestId ? [{ name: room.guestName, slot: 2, user_id: room.guestId }] : [])];
    const me = people.find(p => p.user_id === uid);
    if (!me)
        throw new Error('Você não faz parte desta sala.');
    return { room: { id: roomId, category: room.category, currentRound: room.currentRound, owner: room.ownerId === uid }, me: { userId: uid, name: me.name, slot: me.slot }, people, questions: questions.filter(q => q.active !== false), rounds: rounds.slice().sort((a, b) => b.created_at - a.created_at), answers: rounds.flatMap(r => Object.entries(r.answers ?? {}).map(([user_id, answer]) => ({ id: r.id + '-' + user_id, round_id: r.id, user_id, content: answer.content, created_at: answer.created_at, name: people.find(p => p.user_id === user_id)?.name ?? 'Seu amor', slot: people.find(p => p.user_id === user_id)?.slot ?? 2 }))).sort((a, b) => a.created_at - b.created_at) };
}
export async function observeAuth(callback, onError) { let alive = true, unsubscribe; try {
    const c = await client();
    if (alive)
        unsubscribe = c.a.onAuthStateChanged(c.auth, callback, onError);
}
catch (e) {
    onError(e);
} return () => { alive = false; unsubscribe?.(); }; }
export async function account(mode, email, password) { const c = await client(); if (mode === 'register')
    return c.a.createUserWithEmailAndPassword(c.auth, email.trim(), password); return c.a.signInWithEmailAndPassword(c.auth, email.trim(), password); }
export async function resetPassword(email) { const c = await client(); if (!email.trim())
    throw new Error('Preencha seu e-mail primeiro.'); await c.a.sendPasswordResetEmail(c.auth, email.trim()); }
export async function logout() { const c = await client(); await c.a.signOut(c.auth); }
export async function listRooms() { const c = await client(), uid = signed(c.auth); const snapshot = await c.f.getDocs(c.f.query(c.f.collection(c.db, 'rooms'), c.f.where('memberIds', 'array-contains', uid))); return { rooms: snapshot.docs.map(d => ({ id: d.id, name: d.data().ownerName, createdAt: d.data().createdAt })).sort((a, b) => b.createdAt - a.createdAt) }; }
export async function loadRoom(roomId) { const c = await client(), { room } = await member(c, roomId); const [qs, rs] = await Promise.all([c.f.getDocs(c.f.collection(c.db, 'rooms', roomId, 'questions')), c.f.getDocs(c.f.collection(c.db, 'rooms', roomId, 'rounds'))]); return roomState(roomId, room, qs.docs.map(d => ({ id: d.id, ...d.data() })), rs.docs.map(d => ({ id: d.id, ...d.data() })), signed(c.auth)); }
export async function subscribeRoom(roomId, onChange, onError) {
    const c = await client(), uid = signed(c.auth);
    const { room: initial } = await member(c, roomId);
    let room = initial, questions = null, rounds = null, alive = true;
    const update = () => { if (alive && questions && rounds && rounds.some(r => r.id === room.currentRound)) {
        try {
            onChange(roomState(roomId, room, questions, rounds, uid));
        }
        catch (e) {
            onError(e);
        }
    } };
    const col = (name) => c.f.collection(c.db, 'rooms', roomId, name);
    const unsubs = [c.f.onSnapshot(c.f.doc(c.db, 'rooms', roomId), s => { if (!s.exists()) {
            onError(new Error('Sala indisponível.'));
            return;
        } room = s.data(); update(); }, onError), c.f.onSnapshot(col('questions'), s => { questions = s.docs.map(d => ({ id: d.id, ...d.data() })); update(); }, onError), c.f.onSnapshot(col('rounds'), s => { rounds = s.docs.map(d => ({ id: d.id, ...d.data() })); update(); }, onError)];
    return () => { alive = false; unsubs.forEach(fn => fn()); };
}
export async function gameAction(b) {
    const c = await client(), { f, db, auth } = c, uid = signed(auth);
    if (b.action === 'create') {
        const name = validateContent(b.name, 30), category = b.category || 'all';
        if (!categoryValid(category))
            throw new Error('Categoria inválida.');
        const roomRef = f.doc(f.collection(db, 'rooms')), qList = seedQuestions.map(q => ({ ...q, id: f.doc(f.collection(db, 'rooms', roomRef.id, 'questions')).id, active: true })), q = selectQuestion(qList, [], category), roundRef = f.doc(f.collection(db, 'rooms', roomRef.id, 'rounds')), createdAt = Date.now(), batch = f.writeBatch(db);
        batch.set(roomRef, { ownerId: uid, guestId: null, memberIds: [uid], ownerName: name, guestName: null, currentRound: roundRef.id, category, roundCount: 1, createdAt });
        for (const entry of qList) {
            const { id, ...data } = entry;
            batch.set(f.doc(db, 'rooms', roomRef.id, 'questions', id), data);
        }
        batch.set(roundRef, { questionId: q.id, content: q.content, category: q.category, created_at: createdAt, answers: {} });
        await batch.commit();
        return loadRoom(roomRef.id);
    }
    const roomId = b.roomId;
    if (typeof roomId !== 'string' || !/^[a-zA-Z0-9]{20}$/.test(roomId))
        throw new Error('Código de sala inválido. Cole somente o código de 20 caracteres do convite.');
    if (b.action === 'join') {
        const name = validateContent(b.name, 30), ref = f.doc(db, 'rooms', roomId);
        await f.runTransaction(db, async (tx) => { const snap = await tx.get(ref); if (!snap.exists())
            throw new Error('Esse código não corresponde a uma sala.'); const r = snap.data(); if (validateJoin(r, uid))
            tx.update(ref, { guestId: uid, guestName: name, memberIds: [r.ownerId, uid] }); });
        return loadRoom(roomId);
    }
    const { room, ref } = await member(c, roomId);
    if (b.action === 'next') {
        if (!categoryValid(b.category))
            throw new Error('Categoria inválida.');
        const [qs, rs] = await Promise.all([f.getDocs(f.collection(db, 'rooms', roomId, 'questions')), f.getDocs(f.collection(db, 'rooms', roomId, 'rounds'))]);
        const candidate = selectQuestion(qs.docs.map(d => ({ id: d.id, ...d.data() })), rs.docs.map(d => d.data()), b.category), roundRef = f.doc(f.collection(db, 'rooms', roomId, 'rounds'));
        await f.runTransaction(db, async (tx) => { const current = await tx.get(ref); requireCurrentRound(current.data(), b.roundId); const questionSnap = await tx.get(f.doc(db, 'rooms', roomId, 'questions', candidate.id)); if (!questionSnap.exists() || !questionSnap.data().active)
            throw new Error('Essa pergunta foi removida. Tente novamente.'); const q = questionSnap.data(); if (b.category !== 'all' && q.category !== b.category)
            throw new Error('A categoria da pergunta mudou. Tente novamente.'); tx.set(roundRef, { questionId: candidate.id, content: q.content, category: q.category, created_at: Date.now(), answers: {} }); tx.update(ref, { currentRound: roundRef.id, category: b.category, roundCount: current.data().roundCount + 1 }); });
    }
    else if (b.action === 'answer') {
        const content = validateContent(b.content, 1000), roundRef = f.doc(db, 'rooms', roomId, 'rounds', b.roundId);
        await f.runTransaction(db, async (tx) => { const [current, roundSnap] = await Promise.all([tx.get(ref), tx.get(roundRef)]); requireCurrentRound(current.data(), b.roundId); if (!roundSnap.exists())
            throw new Error('Pergunta indisponível.'); const r = roundSnap.data(); if (r.answers?.[uid])
            throw new Error('Você já respondeu este cartão.'); tx.update(roundRef, { ['answers.' + uid]: { content, created_at: Date.now() } }); });
    }
    else if (b.action === 'saveQuestion' || b.action === 'deleteQuestion') {
        if (room.ownerId !== uid)
            throw new Error('Só quem criou a sala pode organizar as perguntas.');
        if (b.action === 'deleteQuestion') {
            if (!b.questionId)
                throw new Error('Selecione a pergunta.');
            await f.updateDoc(f.doc(db, 'rooms', roomId, 'questions', b.questionId), { active: false });
        }
        else {
            const content = validateContent(b.content, 500);
            if (!categoryValid(b.category) || b.category === 'all')
                throw new Error('Escolha uma categoria.');
            if (b.questionId)
                await f.updateDoc(f.doc(db, 'rooms', roomId, 'questions', b.questionId), { content, category: b.category });
            else
                await f.addDoc(f.collection(db, 'rooms', roomId, 'questions'), { content, category: b.category, active: true });
        }
    }
    else
        throw new Error('Ação inválida.');
    return loadRoom(roomId);
}
export function friendlyError(e) { const map = { 'auth/invalid-credential': 'E-mail ou senha incorretos.', 'auth/email-already-in-use': 'Este e-mail já tem uma conta. Use Entrar.', 'auth/invalid-email': 'Confira o e-mail informado.', 'auth/weak-password': 'Use uma senha com pelo menos 6 caracteres.', 'auth/network-request-failed': 'Não foi possível conectar. Confira a internet e tente novamente.', 'auth/operation-not-allowed': 'Ative E-mail/Senha no Firebase Authentication.', 'permission-denied': 'Acesso negado. Confira se as regras firestore.rules foram aplicadas ao seu banco.', 'unavailable': 'O Firebase está indisponível. Tente novamente.', 'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente novamente.', 'auth/configuration-not-found': 'Configure o Firebase Authentication no seu projeto.' }; return map[e?.code] || e?.message || 'Não foi possível conectar. Tente novamente.'; }
