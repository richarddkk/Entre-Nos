'use client';
import { useState, useEffect, useRef } from 'react';
import { Heart, Sparkles, Smile, Shuffle, Flame, LockKeyhole, Moon, Cherry, MessageCircle, Layers, Plus, Copy, Check, X, Send, Settings2, LogOut, Pencil, Trash2, History, LoaderCircle, Users, ChevronDown, Sun } from 'lucide-react';
import { categories, seedQuestions } from './questions';
import { readTheme, applyTheme, THEME_KEY } from './theme.mjs';
import { configured, observeAuth, account, logout, resetPassword, listRooms, loadRoom, subscribeRoom, gameAction, friendlyError } from './firebase-service.js';
type Question = {
    id: string;
    content: string;
    category: string;
};
type Round = Question & {
    created_at: number;
};
type Answer = {
    id: string;
    round_id: string;
    user_id: string;
    content: string;
    name: string;
    slot: number;
    created_at: number;
};
type State = {
    room: {
        id: string;
        category: string;
        currentRound: string;
        owner: boolean;
    };
    me: {
        userId: string;
        name: string;
        slot: number;
    };
    people: {
        name: string;
        slot: number;
        user_id: string;
    }[];
    rounds: Round[];
    answers: Answer[];
    questions: Question[];
};
const icons: Record<string, typeof Heart> = { Heart, Sparkles, Smile, Shuffle, Flame, LockKeyhole, Moon, Cherry };
const cat = (id: string) => categories.find(c => c.id === id) ?? categories[0];
async function api(body?: any, room?: string): Promise<any> { if (body)
    return gameAction(body); if (room)
    return loadRoom(room); return listRooms(); }
export default function Game() {
    const [theme, setTheme] = useState<'light'|'dark'>(() => readTheme());
    useEffect(() => { applyTheme(theme); }, [theme]);
    useEffect(() => { const sync = (event: StorageEvent) => { if(event.key === THEME_KEY) setTheme(readTheme()); }; window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync); }, []);
    const toggleTheme = () => { const next = theme === 'dark' ? 'light' : 'dark'; applyTheme(next, true); setTheme(next); };

    const [user, setUser] = useState<any>(null), [authReady, setAuthReady] = useState(!configured), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [authMode, setAuthMode] = useState<'login' | 'register'>('register'), [authBusy, setAuthBusy] = useState(false), [authMessage, setAuthMessage] = useState('');
    const signedIn = !!user;
    const sessionUid = useRef<string | null>(null);
    const [state, setState] = useState<State | null>(null), [category, setCategory] = useState('all'), [preview, setPreview] = useState(0), [view, setView] = useState('play'), [modal, setModal] = useState<'create' | 'join' | 'invite' | null>(null), [name, setName] = useState(''), [code, setCode] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false), [copied, setCopied] = useState(false), [drafts, setDrafts] = useState<Record<string, string>>({}), [rooms, setRooms] = useState<{
        id: string;
        name: string;
    }[]>([]), [loaded, setLoaded] = useState(!configured), [edit, setEdit] = useState<Question | null>(null), [questionText, setQuestionText] = useState(''), [questionCategory, setQuestionCategory] = useState('fofas'), [adminFilter, setAdminFilter] = useState('all');
    const roomId = state?.room.id;
    useEffect(() => { if (!configured)
        return; let stop: any, active = true; observeAuth((u: any) => { if (!active)
        return; sessionUid.current = u?.uid ?? null; setUser(u); setAuthReady(true); if (!u) {
        setState(null);
        setRooms([]);
        setLoaded(true);
    } }, (e: any) => { if (active) {
        setError(friendlyError(e));
        setAuthReady(true);
        setLoaded(true);
    } }).then(fn => { if (active)
        stop = fn;
    else
        fn(); }); return () => { active = false; stop?.(); }; }, []);
    const authenticate = async () => { setAuthBusy(true); setError(''); setAuthMessage(''); try {
        await account(authMode, email, password);
        setPassword('');
    }
    catch (e) {
        setError(friendlyError(e));
    }
    finally {
        setAuthBusy(false);
    } };
    const signOut = async () => { try {
        await logout();
        setState(null);
        setRooms([]);
        setView('play');
        setModal(null);
        history.replaceState(null, '', location.pathname);
    }
    catch (e) {
        setError(friendlyError(e));
    } };
    useEffect(() => {
        if (!signedIn)
            return;
        setLoaded(false);
        let alive = true;
        const params = new URLSearchParams(location.search), invite = params.get('convite'), room = params.get('sala');
        if (invite) {
            setCode(invite);
            setModal('join');
        }
        (async () => { try {
            const d = await api();
            if (!alive)
                return;
            setRooms(d.rooms);
            if (room) {
                const s = await api(undefined, room);
                if (alive) {
                    setState(s);
                    setCategory(s.room.category);
                }
            }
        }
        catch (e) {
            if (alive)
                setError(friendlyError(e));
        }
        finally {
            if (alive)
                setLoaded(true);
        } })();
        return () => { alive = false; };
    }, [signedIn, user?.uid]);
    useEffect(() => { if (!roomId)
        return; let active = true, stop: any; subscribeRoom(roomId, (d: any) => { if (active)
        setState(d); }, (e: any) => { if (active)
        setError(friendlyError(e)); }).then(fn => { if (active)
        stop = fn;
    else
        fn(); }).catch(e => { if (active)
        setError(friendlyError(e)); }); return () => { active = false; stop?.(); }; }, [roomId]);
    const run = async (body: Record<string, unknown>) => { const expectedUid = sessionUid.current; setBusy(true); setError(''); try {
        const d: State = await api({ ...body, roomId: state?.room.id, ...(body.roomId ? { roomId: body.roomId } : {}) });
        if (sessionUid.current !== expectedUid)
            return null;
        setState(d);
        return d;
    }
    catch (e) {
        setError(friendlyError(e));
        return null;
    }
    finally {
        setBusy(false);
    } };
    const openSetup = (type: 'create' | 'join' = 'create') => { setError(''); setModal(type); };
    const current = state?.rounds.find(r => r.id === state.room.currentRound);
    const pool = seedQuestions.filter(q => category === 'all' || q.category === category);
    const question = current ?? { ...pool[preview % pool.length], id: 'preview' };
    const qCategory = cat(question.category), QIcon = icons[qCategory.icon];
    const currentAnswers = state?.answers.filter(a => a.round_id === current?.id) ?? [];
    const mine = currentAnswers.find(a => a.user_id === state?.me.userId);
    const draft = drafts[question.id] ?? '';
    const earlierDrafts = Object.entries(drafts).filter(([id, text]) => id !== question.id && id !== 'preview' && text.trim());
    const choose = (id: string) => { setCategory(id); setPreview(0); };
    const next = async () => { if (!state) {
        setPreview(p => p + 1);
        return;
    } await run({ action: 'next', category, roundId: state.room.currentRound }); };
    const enter = async (action: string) => { const d = await run({ action, name, roomId: action === 'join' ? code.trim() : undefined, category }); if (d) {
        setCategory(d.room.category);
        setModal(null);
        history.replaceState(null, '', '?sala=' + d.room.id);
        setRooms(r => [{ id: d.room.id, name }, ...r.filter(x => x.id !== d.room.id)]);
    } };
    const send = async () => { if (!state) {
        openSetup();
        return;
    } const d = await run({ action: 'answer', content: draft, roundId: question.id }); if (d)
        setDrafts(old => ({ ...old, [question.id]: '' })); };
    const copyInvite = async () => { try {
        await navigator.clipboard.writeText(location.origin + location.pathname + '?convite=' + state?.room.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    }
    catch {
        setError('Copie o link exibido abaixo.');
    } };
    const openRoom = async (id: string) => { setBusy(true); try {
        const d = await api(undefined, id);
        setState(d);
        setCategory(d.room.category);
        history.replaceState(null, '', '?sala=' + id);
    }
    catch (e) {
        setError(friendlyError(e));
    }
    finally {
        setBusy(false);
    } };
    useEffect(() => { const context = (document as any).modelContext; if (!context?.registerTool)
        return; const lifecycle = new AbortController(); Promise.resolve(context.registerTool({ name: 'select_question_category', title: 'Escolher categoria', description: 'Seleciona a categoria para a próxima pergunta no jogo Entre Nós.', inputSchema: { type: 'object', properties: { category: { type: 'string', enum: ['all', ...categories.map(c => c.id)] } }, required: ['category'], additionalProperties: false }, annotations: { readOnlyHint: false }, execute(input: {
            category: string;
        }) { if (!['all', ...categories.map(c => c.id)].includes(input.category))
            throw new Error('Categoria inválida'); choose(input.category); return { selectedCategory: input.category }; } }, { signal: lifecycle.signal })).catch(() => { }); return () => lifecycle.abort(); }, []);
    return <div className="app"><header className="topbar"><a href={location.pathname} className="brand"><span className="brand-icon"><Heart size={23} fill="currentColor"/></span><span>entre nós<span className="brand-dot">.</span></span></a><nav aria-label="Navegação principal"><button className={view === 'play' ? 'nav active' : 'nav'} onClick={() => setView('play')}><Layers size={17}/>Jogar</button><button className={view === 'history' ? 'nav active' : 'nav'} onClick={() => state ? setView('history') : openSetup()}><MessageCircle size={17}/>Nossas conversas</button>{state?.room.owner && <button className={view === 'admin' ? 'nav active' : 'nav'} onClick={() => setView('admin')}><Settings2 size={17}/>Perguntas</button>}</nav><div className="header-right"><button className="theme-toggle" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'} aria-pressed={theme === 'dark'} title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}>{theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}<span>{theme === 'dark' ? 'Claro' : 'Escuro'}</span></button>{state ? <button className="profile" onClick={() => setModal('invite')}><span className="avatar small">{state.me.name.slice(0, 1)}</span><span>{state.me.name}</span></button> : signedIn ? <button className="text-button" onClick={signOut}><LogOut size={15}/> Sair da conta</button> : <button className="text-button" onClick={() => openSetup()}>Entrar</button>}</div></header>
 <main className="shell">{!configured && <div className="setup-notice"><Settings2 size={18}/><p><strong>Prévia do seu cantinho.</strong> Configure <code>src/firebase-config.js</code> para ativar contas, salas e respostas compartilhadas. O passo a passo está no README.</p></div>}<div className="page-title"><div><div className="eyebrow"><Sparkles size={14}/> UM TEMPO SÓ DE VOCÊS</div><h1>{view === 'admin' ? 'Do jeitinho de vocês.' : view === 'history' ? 'Cada resposta, uma memória.' : 'Vamos descobrir mais de nós?'}</h1><p>{view === 'admin' ? 'Crie perguntas e escolha a categoria de cada uma.' : view === 'history' ? 'As perguntas e respostas que vocês compartilharam.' : 'Escolham o clima, puxem um cartão e deixem a conversa acontecer.'}</p></div>{state ? <button className="button invite" onClick={() => setModal('invite')}><Users size={17}/> Convidar meu amor</button> : <button className="button" onClick={() => openSetup()}><Plus size={17}/> Criar nossa sala</button>}</div>
 {error && <div className="alert" role="alert">{error}<button aria-label="Fechar aviso" onClick={() => setError('')}><X size={16}/></button></div>}
 {!state && <div className="room-bar"><div className="room-bar-title"><div className="pair"><span className="avatar"><Heart size={16}/></span><span className="avatar second">?</span></div><div><strong>O próximo encontro começa aqui.</strong><span>Uma sala, dois corações e muito para conversar.</span></div></div><div className="room-actions">{!loaded ? <LoaderCircle className="spin" size={18}/> : rooms.length > 0 ? <select aria-label="Voltar a uma sala" value="" onChange={e => openRoom(e.target.value)}><option value="">Voltar à nossa sala</option>{rooms.map(r => <option key={r.id} value={r.id}>Sala de {r.name}</option>)}</select> : null}<button className="text-button" onClick={() => openSetup('join')}>Já tenho um convite</button></div></div>}
 {state && <div className="room-bar compact"><div className="room-bar-title"><div className="pair">{state.people.map(p => <span key={p.slot} className={'avatar ' + (p.slot === 2 ? 'second' : '')}>{p.name.slice(0, 1)}</span>)}{state.people.length === 1 && <span className="avatar second">?</span>}</div><div><strong>{state.people.map(p => p.name).join(' & ')}{state.people.length === 1 ? ' & seu amor' : ''}</strong><span>{state.people.length === 2 ? 'O cantinho de vocês está conectado.' : 'Esperando seu amor entrar pelo convite.'}</span></div></div><button className="text-button" onClick={() => { setState(null); setView('play'); history.replaceState(null, '', location.pathname); }}><LogOut size={15}/> Sair da sala</button></div>}
 {view === 'play' && <div className="game-layout"><aside className="categories"><div className="section-label">QUAL É O CLIMA DE HOJE?</div><button className={'category all ' + (category === 'all' ? 'selected' : '')} onClick={() => choose('all')}><span className="category-icon"><Layers size={21}/></span><span><strong>Um pouco de tudo</strong><small>Misture todas as categorias</small></span>{category === 'all' && <Check size={16}/>}</button><div className="category-list">{categories.map(c => { const Icon = icons[c.icon], count = state ? state.questions.filter(q => q.category === c.id).length : seedQuestions.filter(q => q.category === c.id).length; return <button key={c.id} className={'category ' + (category === c.id ? 'selected' : '')} onClick={() => choose(c.id)} style={{ '--category-color': c.color } as React.CSSProperties}><span className="category-icon"><Icon size={20}/></span><span><strong>{c.name}</strong><small>{count} perguntas</small></span>{category === c.id && <Check size={16}/>}</button>; })}</div><p className="category-foot"><LockKeyhole size={13}/> Cada conversa no seu ritmo.<br />Vale pular qualquer pergunta.</p></aside>
 <section className="play-area" aria-label="Cartão de pergunta"><div className="card-topline"><span><span className="mini-dot"/> {state ? 'NOSSA RODADA' : 'EXPERIMENTE UM CARTÃO'}</span><span>{state ? String(state.rounds.length).padStart(2, '0') : String(preview + 1).padStart(2, '0')} <span className="muted">/ {state ? state.questions.length : 64}</span></span></div><div key={question.id + preview} className="question-card"><div className="card-corner top"><Heart size={16}/></div><div className="question-tag" style={{ color: qCategory.color }}><QIcon size={16}/>{qCategory.name}</div><div className="big-icon" style={{ color: qCategory.color }}><QIcon size={35} strokeWidth={1.3}/></div><h2>{question.content}</h2><p>{qCategory.hint}</p><div className="card-rule"><span /><Heart size={13}/><span /></div><div className="card-corner bottom"><Heart size={16}/></div></div><div className="card-controls"><button className="skip-button" onClick={next} disabled={busy}><Shuffle size={16}/> Pular</button><button className="button next" onClick={next} disabled={busy}>{busy ? <LoaderCircle size={17} className="spin"/> : <Layers size={17}/>} Próxima pergunta</button></div>{state && state.room.category !== category && <p className="selection-note">Próximo cartão: {category === 'all' ? 'um pouco de tudo' : cat(category).name}.</p>}<div className="play-note"><span className="note-heart"><Heart size={17}/></span><p>Não existe resposta certa.<br /><strong>Existe a resposta de vocês.</strong></p></div></section>
 <section className="conversation" aria-label="Respostas desta rodada"><div className="conversation-head"><div><MessageCircle size={19}/><h2>Nossa conversa</h2></div><span className="conversation-count">{state ? `${state.people.length}/2` : 'a dois'}</span></div><p className="conversation-caption">Um cartão. Duas perspectivas.</p><div className="messages" aria-live="polite">{currentAnswers.length === 0 ? <div className="empty-chat"><span className="chat-symbol"><MessageCircle size={31} strokeWidth={1.4}/><Heart size={14} fill="currentColor"/></span><h3>{state ? 'Quem vai começar?' : 'Sua resposta encontra a minha.'}</h3><p>{state ? 'Escreva o que veio ao coração. A resposta aparece aqui para vocês dois.' : 'Criem uma sala e respondam, cada um no seu aparelho.'}</p>{!state && <button className="outline-button" onClick={() => openSetup()}>Vamos jogar juntos</button>}</div> : <div className="answer-list">{currentAnswers.map(a => <div key={a.id} className={'answer ' + (a.user_id === state?.me.userId ? 'mine' : 'theirs')}><span className="answer-author">{a.name}{a.user_id === state?.me.userId ? ' · você' : ''}</span><p>{a.content}</p><time>{new Date(a.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time></div>)}{currentAnswers.length === 1 && <p className="waiting"><Heart size={14}/> Esperando a outra resposta…</p>}</div>}</div><div className="composer">{mine ? <div className="answered"><Check size={17}/> Sua resposta foi enviada com carinho.</div> : <form onSubmit={e => { e.preventDefault(); send(); }}><label htmlFor="answer">{state ? 'Sua vez de responder' : 'Uma boa conversa começa com vocês'}</label><textarea id="answer" placeholder="O que veio ao coração?" maxLength={1000} value={draft} onChange={e => setDrafts(d => ({ ...d, [question.id]: e.target.value }))} rows={3}/><div className="composer-bottom"><span>{draft.length}/1000</span><button className="send" type="submit" aria-label="Enviar resposta" disabled={busy || (!!state && !draft.trim())}><Send size={18}/></button></div></form>}{earlierDrafts.length > 0 && <details className="saved-drafts"><summary>Rascunhos de cartões anteriores ({earlierDrafts.length})</summary>{earlierDrafts.map(([id, text]) => <div key={id}><p>{state?.rounds.find(r => r.id === id)?.content ?? "Cartão anterior"}</p><textarea aria-label="Rascunho guardado" readOnly value={text} rows={3}/><button className="text-button" onClick={() => setDrafts(d => ({ ...d, [id]: '' }))}>Descartar rascunho</button></div>)}</details>}<span className="private-note"><LockKeyhole size={11}/> Só as duas pessoas da sala veem as respostas.</span></div></section></div>}
 {view === 'history' && state && <section className="history-grid">{state.rounds.map((r, i) => { const c = cat(r.category), Icon = icons[c.icon], answers = state.answers.filter(a => a.round_id === r.id); return <article className="history-card" key={r.id}><div className="history-tag" style={{ color: c.color }}><Icon size={16}/> {c.name}<span>#{state.rounds.length - i}</span></div><h2>{r.content}</h2>{answers.length ? answers.map(a => <div className="history-answer" key={a.id}><strong>{a.name}</strong><p>{a.content}</p></div>) : <p className="muted">Esta pergunta ficou sem resposta.</p>}</article>; })}</section>}
 {view === 'admin' && state?.room.owner && <section className="admin-layout"><div className="admin-form"><div className="section-label">{edit ? 'EDITAR PERGUNTA' : 'UM NOVO CARTÃO'}</div><h2>{edit ? 'Ajuste com carinho.' : 'O que você quer perguntar?'}</h2><form onSubmit={async (e) => { e.preventDefault(); const d = await run({ action: 'saveQuestion', questionId: edit?.id, content: questionText, category: questionCategory }); if (d) {
        setQuestionText('');
        setEdit(null);
    } }}><label htmlFor="new-question">Pergunta</label><textarea id="new-question" placeholder="Escreva uma pergunta do jeitinho de vocês…" rows={5} maxLength={500} required value={questionText} onChange={e => setQuestionText(e.target.value)}/><label htmlFor="new-category">Categoria</label><select id="new-category" value={questionCategory} onChange={e => setQuestionCategory(e.target.value)}>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><button className="button" disabled={busy} type="submit"><Plus size={16}/>{edit ? 'Salvar alterações' : 'Adicionar pergunta'}</button>{edit && <button type="button" className="text-button" onClick={() => { setEdit(null); setQuestionText(''); }}>Cancelar edição</button>}</form><p className="muted">As alterações valem para esta sala. Os cartões já jogados ficam preservados no histórico.</p></div><div className="admin-list"><div className="admin-list-top"><h2>Nossos cartões <span>{state.questions.length}</span></h2><select aria-label="Filtrar perguntas por categoria" value={adminFilter} onChange={e => setAdminFilter(e.target.value)}><option value="all">Todas as categorias</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>{state.questions.filter(q => adminFilter === 'all' || q.category === adminFilter).map(q => <article className="admin-row" key={q.id}><div><small style={{ color: cat(q.category).color }}>{cat(q.category).name}</small><p>{q.content}</p></div><div><button aria-label={'Editar ' + q.content} onClick={() => { setEdit(q); setQuestionText(q.content); setQuestionCategory(q.category); document.getElementById('new-question')?.focus(); }}><Pencil size={17}/></button><button aria-label={'Remover ' + q.content} disabled={busy} onClick={() => run({ action: 'deleteQuestion', questionId: q.id })}><Trash2 size={17}/></button></div></article>)}</div></section>}
 <footer><span className="footer-brand">entre nós.</span><span>Um pouquinho de curiosidade. Um montão de carinho.</span>{signedIn ? <button className="text-button" onClick={signOut}>Sair da conta</button> : <Heart size={14}/>}</footer></main>
 {modal && <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget)
        setModal(null); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onKeyDown={e => { if (e.key === 'Escape')
        setModal(null); if (e.key === 'Tab') {
        const nodes = e.currentTarget.querySelectorAll<HTMLElement>('button,a,input,textarea,select');
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        }
        else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    } }}><button autoFocus className="modal-close" aria-label="Fechar" onClick={() => setModal(null)}><X size={20}/></button><div className="modal-heart"><Heart size={28}/></div><h2 id="modal-title">{modal === 'invite' ? 'Chame seu amor.' : modal === 'join' ? 'Seu lugar é aqui.' : 'Um cantinho só de vocês.'}</h2>{modal === 'invite' ? <><p>Envie este convite para seu amor. Cada um entra com a própria conta de e-mail e senha.</p><label htmlFor="invite-link">Link do convite</label><input id="invite-link" readOnly value={typeof window !== 'undefined' ? location.origin + location.pathname + '?convite=' + state?.room.id : ''} onFocus={e => e.target.select()}/><button className="button wide" onClick={copyInvite}>{copied ? <Check size={17}/> : <Copy size={17}/>} {copied ? 'Convite copiado!' : 'Copiar convite'}</button><p className="modal-detail">O convite dá acesso à segunda vaga da sala. Compartilhe apenas com seu amor. Para usar em outro aparelho, os dois precisam acessar o mesmo endereço do site.</p></> : !signedIn ? <><p>{configured ? 'Crie sua conta ou entre para salvar suas respostas. Seu amor usa uma conta diferente.' : 'Antes de criar a sala, configure o Firebase seguindo o README que veio com o projeto.'}</p>{configured && <form onSubmit={e => { e.preventDefault(); authenticate(); }}><div className="auth-tabs"><button type="button" className={authMode === 'register' ? 'selected' : ''} onClick={() => setAuthMode('register')}>Criar conta</button><button type="button" className={authMode === 'login' ? 'selected' : ''} onClick={() => setAuthMode('login')}>Entrar</button></div><label htmlFor="auth-email">E-mail</label><input id="auth-email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}/><label htmlFor="auth-password">Senha</label><input id="auth-password" type="password" required minLength={6} autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)}/><button className="button wide" disabled={authBusy || !authReady} type="submit">{authBusy ? <LoaderCircle className="spin" size={17}/> : <Heart size={17}/>} {authMode === 'register' ? 'Criar minha conta' : 'Entrar na minha conta'}</button>{authMode === 'login' && <button type="button" className="text-button switch-mode" disabled={authBusy} onClick={async () => { setAuthBusy(true); try {
        await resetPassword(email);
        setAuthMessage('Se o e-mail estiver cadastrado, você receberá instruções para redefinir a senha.');
    }
    catch (e) {
        setError(friendlyError(e));
    }
    finally {
        setAuthBusy(false);
    } }}>Esqueci minha senha</button>}{authMessage && <p role="status">{authMessage}</p>}</form>}</> : <form onSubmit={e => { e.preventDefault(); enter(modal); }}><p>{modal === 'create' ? '64 perguntas para começar. Depois, você pode criar e organizar seus próprios cartões.' : 'Cole o código que veio no convite e vamos conversar.'}</p><label htmlFor="player-name">Como você quer ser chamado(a)?</label><input id="player-name" maxLength={30} required placeholder="Seu nome ou apelido" value={name} onChange={e => setName(e.target.value)}/>{modal === 'join' && <><label htmlFor="room-code">Código da sala</label><input id="room-code" maxLength={32} required placeholder="Cole o código do convite" value={code} onChange={e => setCode(e.target.value)}/></>}<button disabled={busy} className="button wide" type="submit">{busy ? <LoaderCircle className="spin" size={17}/> : <Heart size={17}/>} {modal === 'create' ? 'Criar nossa sala' : 'Entrar na sala'}</button><button className="text-button switch-mode" type="button" onClick={() => setModal(modal === 'create' ? 'join' : 'create')}>{modal === 'create' ? 'Já tenho um convite' : 'Quero criar uma sala'}</button></form>}{error && <p className="modal-error" role="alert">{error}</p>}</section></div>}
 </div>;
}
