const API = '/api';
const el = (id) => document.getElementById(id);
const estado = { status: '', tarefas: [] };

const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

async function chamar(caminho, opcoes = {}) {
  const resposta = await fetch(`${API}${caminho}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opcoes,
  });
  if (resposta.status === 204) return null;
  const corpo = await resposta.json();
  if (!resposta.ok) throw new Error(corpo.error || 'Não foi possível concluir a ação.');
  return corpo.data;
}

function mostrarAviso(mensagem) {
  const aviso = el('aviso');
  aviso.textContent = mensagem;
  aviso.hidden = !mensagem;
}

function textoPrazo(tarefa) {
  if (tarefa.status === 'concluida') return { forte: 'feita', fraco: tarefa.dueDate };
  if (tarefa.daysLeft < 0) {
    const dias = Math.abs(tarefa.daysLeft);
    return { forte: `${dias}d atrás`, fraco: 'venceu' };
  }
  if (tarefa.daysLeft === 0) return { forte: 'hoje', fraco: tarefa.dueDate };
  return { forte: `${tarefa.daysLeft}d`, fraco: tarefa.dueDate };
}

function desenharRegua() {
  const trilho = el('regua-dias');
  trilho.textContent = '';
  const hoje = new Date();

  for (let i = 0; i < 14; i += 1) {
    const data = new Date(hoje);
    data.setDate(hoje.getDate() + i);
    const iso = data.toISOString().slice(0, 10);

    const dia = document.createElement('div');
    dia.className = 'dia';
    if (i === 0) dia.classList.add('hoje', 'marco');
    if (data.getDay() === 1) dia.classList.add('marco');

    const numero = document.createElement('span');
    numero.className = 'numero';
    numero.textContent = String(data.getDate());

    const rotulo = document.createElement('span');
    rotulo.textContent = i === 0 ? 'hoje' : DIAS_SEMANA[data.getDay()];

    const pontos = document.createElement('div');
    pontos.className = 'pontos';
    estado.tarefas
      .filter((tarefa) => tarefa.dueDate === iso && tarefa.status !== 'concluida')
      .slice(0, 4)
      .forEach((tarefa) => {
        const ponto = document.createElement('span');
        ponto.className = 'ponto';
        if (tarefa.priority === 'urgente' || tarefa.priority === 'alta') {
          ponto.classList.add('urgente');
        }
        ponto.title = tarefa.title;
        pontos.append(ponto);
      });

    dia.append(numero, rotulo, pontos);
    trilho.append(dia);
  }
}

function desenharLista() {
  const lista = el('lista');
  lista.textContent = '';
  const visiveis = estado.status
    ? estado.tarefas.filter((tarefa) =>
        estado.status === 'pendente' ? tarefa.status !== 'concluida' : tarefa.status === 'concluida'
      )
    : estado.tarefas;

  el('vazio').hidden = visiveis.length > 0;

  for (const tarefa of visiveis) {
    const item = document.createElement('li');
    item.className = 'item';
    if (tarefa.overdue) item.classList.add('atrasada');
    if (tarefa.status === 'concluida') item.classList.add('concluida');

    const bloco = document.createElement('div');
    const titulo = document.createElement('div');
    titulo.className = 'titulo-tarefa';
    titulo.textContent = tarefa.title;
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `${tarefa.subject} · prioridade ${tarefa.priority}`;
    bloco.append(titulo, meta);

    const prazo = document.createElement('div');
    prazo.className = 'prazo';
    const { forte, fraco } = textoPrazo(tarefa);
    const forteEl = document.createElement('strong');
    forteEl.textContent = forte;
    const fracoEl = document.createElement('span');
    fracoEl.textContent = fraco;
    prazo.append(forteEl, fracoEl);

    const acoes = document.createElement('div');
    acoes.className = 'acoes';
    const alternar = document.createElement('button');
    alternar.type = 'button';
    alternar.textContent = tarefa.status === 'concluida' ? 'Reabrir' : 'Concluir';
    alternar.addEventListener('click', () =>
      agir(`/tasks/${tarefa.id}/${tarefa.status === 'concluida' ? 'reopen' : 'complete'}`, 'POST')
    );
    const remover = document.createElement('button');
    remover.type = 'button';
    remover.textContent = 'Excluir';
    remover.addEventListener('click', () => agir(`/tasks/${tarefa.id}`, 'DELETE'));
    acoes.append(alternar, remover);

    item.append(bloco, prazo, acoes);
    lista.append(item);
  }
}

async function carregar() {
  try {
    const [tarefas, resumo] = await Promise.all([chamar('/tasks'), chamar('/tasks/summary')]);
    estado.tarefas = tarefas;
    el('c-total').textContent = resumo.total;
    el('c-pendentes').textContent = resumo.pendentes;
    el('c-atrasadas').textContent = resumo.atrasadas;
    el('c-concluidas').textContent = resumo.concluidas;
    desenharRegua();
    desenharLista();
    mostrarAviso('');
  } catch (erro) {
    mostrarAviso(erro.message);
  }
}

async function agir(caminho, metodo) {
  try {
    await chamar(caminho, { method: metodo });
    await carregar();
  } catch (erro) {
    mostrarAviso(erro.message);
  }
}

async function adicionar() {
  const corpo = {
    title: el('in-titulo').value,
    subject: el('in-materia').value,
    dueDate: el('in-prazo').value,
    priority: el('in-prioridade').value,
  };

  if (!corpo.dueDate) {
    mostrarAviso('Escolha a data de entrega antes de adicionar.');
    return;
  }

  try {
    await chamar('/tasks', { method: 'POST', body: JSON.stringify(corpo) });
    el('in-titulo').value = '';
    el('in-titulo').focus();
    await carregar();
  } catch (erro) {
    mostrarAviso(erro.message);
  }
}

el('btn-adicionar').addEventListener('click', adicionar);
el('in-titulo').addEventListener('keydown', (evento) => {
  if (evento.key === 'Enter') adicionar();
});

document.querySelectorAll('.filtro').forEach((botao) => {
  botao.addEventListener('click', () => {
    document.querySelectorAll('.filtro').forEach((outro) => outro.classList.remove('ativo'));
    botao.classList.add('ativo');
    estado.status = botao.dataset.status;
    desenharLista();
  });
});

el('in-prazo').value = new Date().toISOString().slice(0, 10);
carregar();
