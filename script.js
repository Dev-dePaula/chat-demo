const contacts = [
  {id:"joao", name:"João Silva", initials:"JS", phone:"+55 17 99999-0000", status:"online agora", color:"blue", unread:2},
  {id:"maria", name:"Maria Oliveira", initials:"MO", phone:"+55 17 98888-1111", status:"online há 2 min", color:"pink", unread:0},
  {id:"equipe", name:"Equipe do Projeto", initials:"EP", phone:"8 participantes", status:"4 online", color:"green", unread:5},
  {id:"carlos", name:"Carlos Mendes", initials:"CM", phone:"+55 17 97777-2222", status:"visto há 20 min", color:"orange", unread:0}
];

const seed = {
  joao: [
    {mine:false,text:"Olá Anderson! Tudo certo?",time:"15:42"},
    {mine:true,text:"Tudo certo! Estou preparando a demonstração do projeto.",time:"15:43"},
    {mine:false,text:"Legal! A arquitetura com Socket.IO e LiveKit ficou bem interessante.",time:"15:44"},
    {mine:true,text:"Sim. A ideia é ter chat, arquivos e chamadas em uma única plataforma.",time:"15:45"}
  ],
  maria: [{mine:false,text:"Oi! Podemos conversar mais tarde?",time:"15:30"}],
  equipe: [{mine:false,text:"Pessoal, a nova versão da plataforma está disponível para testes.",time:"14:18"}],
  carlos: [{mine:true,text:"Você conseguiu revisar o documento?",time:"13:07"},{mine:false,text:"Sim, vou te responder ainda hoje.",time:"13:12"}]
};

let current = "joao";
let conversations = JSON.parse(localStorage.getItem("connectchat_messages") || "null") || seed;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function save(){ localStorage.setItem("connectchat_messages", JSON.stringify(conversations)); }

function avatarHTML(c, extra=""){
  return `<div class="avatar ${extra}">${c.initials}</div>`;
}

function renderList(filter=""){
  const list = $("#chatList");
  list.innerHTML = "";
  contacts.filter(c => c.name.toLowerCase().includes(filter.toLowerCase())).forEach(c => {
    const msgs = conversations[c.id] || [];
    const last = msgs[msgs.length-1];
    const item = document.createElement("div");
    item.className = "chat-item " + (c.id===current ? "active":"");
    item.dataset.id = c.id;
    item.innerHTML = `${avatarHTML(c)}
      <div class="chat-meta">
        <strong>${c.name}<time>${last?.time || ""}</time></strong>
        <p>${last ? (last.mine ? "Você: " : "") + escapeHTML(last.text || "📎 Arquivo") : "Nova conversa"} ${c.unread ? `<span class="badge">${c.unread}</span>` : ""}</p>
      </div>`;
    item.onclick = () => selectChat(c.id);
    list.appendChild(item);
  });
}

function selectChat(id){
  current=id;
  const c=contacts.find(x=>x.id===id);
  c.unread=0;
  $("#headerName").textContent=c.name;
  $("#headerStatus").textContent=c.status;
  $("#headerAvatar").textContent=c.initials;
  $("#detailsAvatar").textContent=c.initials;
  $("#detailsName").textContent=c.name;
  $("#detailsPhone").textContent=c.phone;
  renderMessages();
  renderList($("#searchInput").value);
}

function renderMessages(){
  const box=$("#messages");
  const msgs=conversations[current] || [];
  box.innerHTML=`<div class="day-divider">HOJE</div>`;
  msgs.forEach(m=>{
    const row=document.createElement("div");
    row.className="message-row "+(m.mine?"mine":"");
    const content=m.file
      ? `<div class="attachment"><span class="file-icon">📎</span><div><strong>${escapeHTML(m.file)}</strong><small style="display:block;color:#929baa">Arquivo anexado</small></div></div>`
      : `<p>${escapeHTML(m.text)}</p>`;
    row.innerHTML=`<div class="bubble">${content}<div class="bubble-meta">${m.time}${m.mine?" · ✓✓":""}</div></div>`;
    box.appendChild(row);
  });
  box.scrollTop=box.scrollHeight;
}

function escapeHTML(v){
  return String(v).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
}
function now(){return new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});}
function toast(msg){
  const t=$("#toast");t.textContent=msg;t.classList.add("show");
  clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove("show"),2200);
}

function send(text){
  text=text.trim(); if(!text)return;
  conversations[current] ??= [];
  conversations[current].push({mine:true,text,time:now()});
  save(); renderMessages(); renderList($("#searchInput").value);
  $("#messageInput").value="";
  simulateReply();
}

function simulateReply(){
  $("#typing").style.visibility="visible";
  clearTimeout(window.__reply);
  window.__reply=setTimeout(()=>{
    $("#typing").style.visibility="hidden";
    if(current==="joao"){
      conversations[current].push({mine:false,text:"Perfeito! Essa demonstração já mostra bem a experiência do produto.",time:now()});
      save();renderMessages();renderList($("#searchInput").value);
    }
  },1200);
}

$("#sendBtn").onclick=()=>send($("#messageInput").value);
$("#messageInput").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send(e.target.value)}});

$("#searchInput").oninput=e=>renderList(e.target.value);
$("#emojiBtn").onclick=()=>{$("#messageInput").value+=" 😊";$("#messageInput").focus()};
$("#attachBtn").onclick=()=>$("#fileInput").click();
$("#fileInput").onchange=e=>{
  const file=e.target.files[0]; if(!file)return;
  conversations[current].push({mine:true,file:file.name,time:now()});
  save();renderMessages();renderList($("#searchInput").value);toast("Arquivo anexado à demonstração");
  e.target.value="";
};

$$("[data-call]").forEach(btn=>btn.onclick=()=>{
  $("#callTitle").textContent=btn.dataset.call==="video"?"Chamada de vídeo":"Chamada de áudio";
  $("#callSubtitle").textContent=`Conectando com ${contacts.find(c=>c.id===current).name}...`;
  $("#callModal").classList.remove("hidden");
});
$("#closeCall").onclick=()=>$("#callModal").classList.add("hidden");
$("#endCall").onclick=()=>{$("#callModal").classList.add("hidden");toast("Chamada encerrada (demo)")};
$("#newChat").onclick=()=>toast("Nova conversa — conecte ao seu backend para criar usuários reais.");
$("#openSearch").onclick=()=>{$("#searchInput").focus();toast("Pesquisa global ativada")};
$("#moreBtn").onclick=()=>toast("Menu de conversa — demonstração");
$("#profileMenu").onclick=()=>toast("Perfil do usuário");
$$(".footer-btn").forEach(b=>b.onclick=()=>toast(b.dataset.action==="notifications"?"Você tem 3 notificações":"Configurações da plataforma"));

renderList();
selectChat("joao");
$("#typing").style.visibility="hidden";
