let questions = [];
let currentQ = 0;
let answers = {};
let token = localStorage.getItem('token');
let user = localStorage.getItem('user');

const api = async (url, method = 'GET', body = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : null });
    if (res.status === 401) logout();
    return res.json();
};

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function saveProgress() {
    if (questions.length > 0) {
        localStorage.setItem('exam_progress', JSON.stringify({
            questions,
            currentQ,
            answers,
            timestamp: Date.now()
        }));
    }
}

function loadProgress() {
    const saved = localStorage.getItem('exam_progress');
    if (saved) {
        const data = JSON.parse(saved);
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
            questions = data.questions;
            currentQ = data.currentQ;
            answers = data.answers;
            return true;
        } else {
            localStorage.removeItem('exam_progress');
        }
    }
    return false;
}

function clearProgress() {
    localStorage.removeItem('exam_progress');
}

if (token) {
    document.getElementById('user-display').innerText = user;
    if (loadProgress()) {
        if (confirm('Você tem um simulado em andamento. Deseja continuar?')) {
            showScreen('simulado-screen');
            renderQuestion();
        } else {
            clearProgress();
            loadDashboard();
        }
    } else {
        loadDashboard();
    }
} else {
    showScreen('login-screen');
}

async function login() {
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    const btn = document.getElementById('btn-login-action');
    btn.disabled = true;
    btn.innerText = 'Entrando...';
    try {
        const res = await api('/api/login', 'POST', { username: u, password: p });
        if (res.token) {
            token = res.token;
            user = res.username;
            localStorage.setItem('token', token);
            localStorage.setItem('user', user);
            document.getElementById('user-display').innerText = user;
            loadDashboard();
        } else {
            document.getElementById('login-msg').innerText = res.error || 'Erro';
        }
    } catch (e) {
        document.getElementById('login-msg').innerText = 'Erro de conexão';
    } finally {
        btn.disabled = false;
        btn.innerText = 'Entrar';
    }
}

async function register() {
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    const res = await api('/api/register', 'POST', { username: u, password: p });
    if (res.success) {
        alert('Conta criada! Faça login.');
    } else {
        alert(res.error);
    }
}

function logout() {
    localStorage.clear();
    location.reload();
}

async function loadDashboard() {
    showScreen('dashboard-screen');
    const history = await api('/api/history');
    const ranking = await api('/api/ranking');

    const lastRes = document.getElementById('last-result');
    if (history.length > 0) {
        const last = history[0];
        const pct = Math.round((last.score / last.total) * 100);
        let color = pct >= 70 ? 'var(--accent)' : (pct >= 50 ? '#eab308' : 'var(--danger)');
        lastRes.innerHTML = `
            <div style="text-align: center;">
                <h1 style="font-size: 3.5rem; color: ${color}">${pct}%</h1>
                <p style="opacity: 0.8;">${last.score} de ${last.total} acertos</p>
                <div style="width: 100%; background: #334155; height: 8px; border-radius: 4px; margin-top: 10px;">
                    <div style="width: ${pct}%; background: ${color}; height: 100%; border-radius: 4px;"></div>
                </div>
            </div>
        `;
    } else {
        lastRes.innerHTML = "<p style='text-align:center; opacity:0.6;'>Nenhum simulado realizado ainda.</p>";
    }

    const histList = document.getElementById('history-list');
    histList.innerHTML = history.slice(0, 5).map(h => {
        const pct = Math.round((h.score / h.total) * 100);
        return `
            <li>
                <div style="display:flex; flex-direction:column;">
                    <span style="font-size: 0.8rem; opacity: 0.7;">${new Date(h.date).toLocaleDateString()} ${new Date(h.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <span style="font-weight: bold;">Simulado Geral</span>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: bold; color: ${pct >= 50 ? 'var(--accent)' : 'var(--danger)'}">${pct}%</div>
                    <div style="font-size: 0.8rem; opacity: 0.7;">${h.score}/${h.total}</div>
                </div>
            </li>
        `;
    }).join('') || "<p style='padding:10px; opacity:0.5;'>Histórico vazio.</p>";

    const rankList = document.getElementById('ranking-list');
    rankList.innerHTML = ranking.map((r, i) => `
        <li style="${r.username === user ? 'background: rgba(59, 130, 246, 0.1); border-left: 3px solid var(--primary);' : ''}">
            <div style="display:flex; align-items:center; gap: 10px;">
                <span style="font-weight:bold; color: var(--primary); width: 25px;">#${i+1}</span>
                <span>${r.username} ${r.username === user ? '(Você)' : ''}</span>
            </div>
            <span style="font-weight: bold;">${Math.round((r.score/r.total)*100)}%</span>
        </li>
    `).join('') || "<p style='padding:10px; opacity:0.5;'>Ranking vazio.</p>";
}

async function startSimulado() {
    const res = await api('/api/questions');
    if (!res || res.length === 0) return alert('Sem questões carregadas.');
    
    questions = res.sort(() => Math.random() - 0.5);
    if (questions.length > 80) questions = questions.slice(0, 80);
    
    currentQ = 0;
    answers = {};
    saveProgress();
    showScreen('simulado-screen');
    renderQuestion();
}

function renderQuestion() {
    const q = questions[currentQ];
    document.getElementById('q-number').innerText = `Questão ${currentQ + 1}/${questions.length}`;
    document.getElementById('q-text').innerText = q.texto;
    
    const optsDiv = document.getElementById('q-options');
    optsDiv.innerHTML = '';
    
    q.alts.forEach((alt, idx) => {
        const div = document.createElement('div');
        div.className = `option ${answers[currentQ] === idx ? 'selected' : ''}`;
        div.innerText = alt.l || alt;
        div.onclick = () => selectOption(idx);
        optsDiv.appendChild(div);
    });

    document.getElementById('btn-next').style.display = currentQ === questions.length - 1 ? 'none' : 'inline-block';
    document.getElementById('btn-finish').style.display = currentQ === questions.length - 1 ? 'inline-block' : 'none';
    saveProgress();
}

function selectOption(idx) {
    answers[currentQ] = idx;
    renderQuestion();
}

function nextQuestion() {
    if (currentQ < questions.length - 1) {
        currentQ++;
        renderQuestion();
    }
}

function prevQuestion() {
    if (currentQ > 0) {
        currentQ--;
        renderQuestion();
    }
}

function quitSimulado() {
    if (confirm('Sair do simulado? Progresso será perdido.')) {
        clearProgress();
        loadDashboard();
    }
}

async function finishSimulado() {
    const totalQuestions = questions.length;
    const answeredCount = Object.keys(answers).length;
    
    if (answeredCount < totalQuestions) {
        if (!confirm(`Você respondeu apenas ${answeredCount} de ${totalQuestions} questões. Deseja finalizar mesmo assim ou retornar para completar?`)) {
            return;
        }
    } else {
        if (!confirm('Finalizar e ver resultado?')) return;
    }
    
    let score = 0;
    let subjectStats = {};

    questions.forEach((q, idx) => {
        const userAnsIdx = answers[idx];
        const letterMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4 };
        const correctIdx = letterMap[q.correta.trim().toUpperCase()];
        const isCorrect = userAnsIdx === correctIdx;
        if (isCorrect) score++;

        const mat = q.materia || 'Geral';
        const content = q.conteudo || 'Geral';

        if (!subjectStats[mat]) subjectStats[mat] = { total: 0, correct: 0, contents: {} };
        subjectStats[mat].total++;
        if (isCorrect) subjectStats[mat].correct++;

        if (!subjectStats[mat].contents[content]) subjectStats[mat].contents[content] = { total: 0, correct: 0 };
        subjectStats[mat].contents[content].total++;
        if (isCorrect) subjectStats[mat].contents[content].correct++;
    });

    try {
        await api('/api/submit', 'POST', {
            score,
            total: questions.length,
            subjects: subjectStats
        });

        clearProgress();
        showScreen('result-screen');
        document.getElementById('score-val').innerText = score;
        document.getElementById('total-val').innerText = questions.length;

        const subList = document.getElementById('subject-list');
        subList.innerHTML = Object.keys(subjectStats).map(mat => {
            const s = subjectStats[mat];
            const pct = Math.round((s.correct / s.total) * 100);
            const isBad = pct < 50;
            
            let contentsHtml = Object.keys(s.contents).map(c => {
                const cs = s.contents[c];
                const cpct = Math.round((cs.correct / cs.total) * 100);
                return `<div style="font-size: 0.8rem; margin-left: 10px; opacity: 0.8;">- ${c}: ${cpct}%</div>`;
            }).join('');

            let html = `
                <li class="${isBad ? 'bad-subject' : 'good-subject'}" style="flex-direction: column; align-items: flex-start;">
                    <div style="display: flex; justify-content: space-between; width: 100%;">
                        <span>${mat}</span>
                        <span>${pct}%</span>
                    </div>
                    ${contentsHtml}
                </li>
            `;
            if (isBad) {
                const badContents = Object.keys(s.contents).filter(c => (s.contents[c].correct / s.contents[c].total) < 0.5);
                const query = badContents.length > 0 ? badContents.join(' ') : mat;
                html += `<a href="https://www.youtube.com/results?search_query=aula+${mat}+${query}" target="_blank" class="rec-link">📚 Reforçar ${mat}: ${badContents.join(', ')}</a>`;
            }
            return html;
        }).join('');
    } catch (e) {
        alert('Erro ao salvar resultado.');
    }
}

function showDashboard() {
    loadDashboard();
}
