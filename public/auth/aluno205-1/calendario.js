window.addEventListener('DOMContentLoaded', async () => {
  const usuarioRaw = localStorage.getItem('usuarioLogado');
  const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null;

  const acessoNegado = document.getElementById('acessoNegado');
  const calendarioAluno = document.getElementById('calendarioAluno');
  const carregando = document.getElementById('carregandoCalendario');

  // Permitir aluno205-1, dev205-1 e admins
  const isAuthorized = usuario && (
    usuario.nome === 'aluno205-1' || 
    usuario.nome === 'dev205-1' || 
    usuario.nome === 'administrador_turma205-1' ||
    usuario.is_admin ||
    usuario.is_root
  );
  
  if (!isAuthorized) {
    acessoNegado.style.display = 'block';
    calendarioAluno.style.display = 'none';
    carregando.style.display = 'none';
    return;
  }

  acessoNegado.style.display = 'none';
  calendarioAluno.style.display = 'block';
  carregando.style.display = 'block';

  try {
    const res = await fetch('/api/calendario');
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    const response = await res.json();
    const eventos = Array.isArray(response.data) ? response.data : [];

    const semana = getCurrentWeekDays();
    const eventosPorDia = mapEventsByWeekday(eventos, semana);

    const semanaResumo = document.getElementById('semanaResumo');
    semanaResumo.textContent = `Exibindo eventos de ${formatDate(semana[0].date)} a ${formatDate(semana[4].date)}.`;

    const calendarioWeek = document.getElementById('calendarioWeek');
    calendarioWeek.innerHTML = semana.map((dia) => {
      const eventosDia = eventosPorDia[dia.weekday] || [];
      return `
        <article class="dia-card" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(148,163,184,0.18); border-radius: 20px; padding: 1rem; height: auto; display: flex; flex-direction: column; justify-content: flex-start;">
          <div>
            <h3 style="margin: 0 0 0.5rem; font-size: 1.05rem;">${dia.label}</h3>
            <span style="color: #94a3b8; font-size: 0.85rem;">${formatDate(dia.date)}</span>
          </div>
          <div style="margin-top: 1rem; flex: 1; display: flex; flex-direction: column; gap: 0.8rem;">
            ${eventosDia.length ? eventosDia.map((evento) => `
              <div style="background: rgba(59,130,246,0.1); border-radius: 16px; padding: 0.9rem;">
                <strong style="display: block; margin-bottom: 0.3rem;">${evento.titulo || 'Sem título'}</strong>
                <p style="margin: 0; color: #cbd5e1; font-size: 0.92rem;">${evento.descricao || 'Sem descrição'}</p>
                <small style="display: block; margin-top: 0.5rem; color: #60a5fa;">${evento.tipo || 'Aviso'}</small>
              </div>
            `).join('') : `<p style="color: #94a3b8; margin: 0;">Nenhum evento.</p>`}
          </div>
        </article>
      `;
    }).join('');
  } catch (error) {
    const calendarioWeek = document.getElementById('calendarioWeek');
    calendarioWeek.innerHTML = `<div style="padding: 1.5rem; background: rgba(220,38,38,0.12); border-radius: 18px; color: #991b1b;">Falha ao carregar o calendário: ${error.message}</div>`;
  } finally {
    carregando.style.display = 'none';
  }
});

function getCurrentWeekDays() {
  const hoje = new Date();
  const primeiroDia = new Date(hoje);
  const diaSemana = hoje.getDay();
  const mondayOffset = diaSemana === 0 ? -6 : 1 - diaSemana;
  primeiroDia.setDate(hoje.getDate() + mondayOffset);

  const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
  return labels.map((label, index) => {
    const date = new Date(primeiroDia);
    date.setDate(primeiroDia.getDate() + index);
    return { label, date, weekday: date.toISOString().slice(0, 10) };
  });
}

function mapEventsByWeekday(eventos, semana) {
  return eventos.reduce((acc, evento) => {
    const data = evento.data ? new Date(evento.data) : null;
    if (!data || isNaN(data.getTime())) return acc;
    const key = data.toISOString().slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(evento);
    return acc;
  }, {});
}

function formatDate(date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
