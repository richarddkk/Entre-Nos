export function selectQuestion(questions, rounds, category, random = Math.random) {
    const seen = new Set(rounds.map(r => r.questionId));
    const available = questions.filter(q => q.active !== false && (category === 'all' || q.category === category) && !seen.has(q.id));
    if (!available.length)
        throw new Error('Vocês já viram todas as perguntas desta seleção. Escolham outra categoria ou adicionem novos cartões.');
    return available[Math.floor(random() * available.length)];
}
export function requireCurrentRound(room, roundId) { if (room.currentRound !== roundId)
    throw new Error('A pergunta mudou. Seu texto foi mantido; abra a rodada atual antes de enviar.'); }
export function validateContent(value, max) { if (typeof value !== 'string' || !value.trim())
    throw new Error('Preencha o texto.'); if (value.trim().length > max)
    throw new Error(`Use no máximo ${max} caracteres.`); return value.trim(); }
export function validateJoin(room, uid) { if (room.memberIds.includes(uid))
    return false; if (room.guestId)
    throw new Error('Esta sala já tem duas pessoas.'); return true; }
