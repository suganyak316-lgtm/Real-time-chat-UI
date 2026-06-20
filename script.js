// =====================================
// DOM ELEMENTS
// =====================================

const messagesWrapper = document.getElementById("messagesWrapper");
const chatContainer = document.getElementById("chatContainer");

const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

const typingIndicator =
document.getElementById("typingIndicator");

const connectionStatus =
document.getElementById("connectionStatus");

const statusText =
document.getElementById("statusText");

const charCounter =
document.getElementById("charCounter");

const emojiBtn =
document.getElementById("emojiBtn");

const emojiPicker =
document.getElementById("emojiPicker");

const emojiGrid =
document.querySelector(".emoji-grid");

const fileInput =
document.getElementById("fileInput");

const previewArea =
document.getElementById("previewArea");

const commandPalette =
document.getElementById("commandPalette");

const notifySound =
document.getElementById("notifySound");


// =====================================
// APP STATE
// =====================================

let messages = [];

let visibleStart = 0;
let visibleEnd = 30;

let socket = null;
let reconnectAttempts = 0;

const MAX_RENDER = 30;


// =====================================
// EMOJI LIST
// =====================================

const emojis = [
"😀","😁","😂","🤣",
"😊","😍","😎","🤩",
"👍","👏","🔥","❤️",
"😮","😢","😡","🎉",
"🚀","💯","🙌","🤖"
];


// =====================================
// CREATE EMOJI PICKER
// =====================================

function buildEmojiPicker() {

    emojiGrid.innerHTML = "";

    emojis.forEach(emoji => {

        const div = document.createElement("div");

        div.className = "emoji";
        div.textContent = emoji;

        div.addEventListener("click", () => {

            messageInput.value += emoji;

            updateCounter();

            emojiPicker.classList.add("hidden");

            messageInput.focus();

        });

        emojiGrid.appendChild(div);

    });

}

buildEmojiPicker();


// =====================================
// REQUEST NOTIFICATION PERMISSION
// =====================================

if ("Notification" in window) {

    Notification.requestPermission();

}


// =====================================
// WEBSOCKET SIMULATION
// =====================================

function connectSocket() {

    updateConnectionUI("connecting");

    setTimeout(() => {

        socket = {

            readyState: 1

        };

        reconnectAttempts = 0;

        updateConnectionUI("connected");

        console.log("Socket Connected");

    }, 1500);

}


// =====================================
// CONNECTION STATUS UI
// =====================================

function updateConnectionUI(state) {

    connectionStatus.classList.remove(
        "connected",
        "disconnected",
        "reconnecting"
    );

    switch(state){

        case "connected":

            connectionStatus.classList.add(
                "connected"
            );

            statusText.textContent =
            "Connected";

            break;

        case "disconnected":

            connectionStatus.classList.add(
                "disconnected"
            );

            statusText.textContent =
            "Disconnected";

            break;

        case "connecting":

            connectionStatus.classList.add(
                "reconnecting"
            );

            statusText.textContent =
            "Reconnecting...";

            break;
    }
}


// =====================================
// AUTO RECONNECT
// =====================================

function simulateDisconnect(){

    setInterval(() => {

        if(Math.random() < 0.1){

            socket = null;

            updateConnectionUI(
                "disconnected"
            );

            reconnectSocket();

        }

    }, 15000);

}

function reconnectSocket(){

    reconnectAttempts++;

    updateConnectionUI(
        "connecting"
    );

    const delay =
    Math.min(
        reconnectAttempts * 2000,
        10000
    );

    setTimeout(() => {

        connectSocket();

    }, delay);

}


// =====================================
// MESSAGE MODEL
// =====================================

function createMessage(
    sender,
    text,
    type = "text"
){

    return {

        id:
        Date.now() +
        Math.random(),

        sender,

        text,

        type,

        timestamp:
        new Date(),

        reactions:{},

        status:"sent"

    };

}


// =====================================
// GENERATE 10,000 MESSAGES
// =====================================

function generateMessages(){

    const sampleTexts = [

        "Hello!",
        "How are you?",
        "Working on project.",
        "Looks good.",
        "Let's meet tomorrow.",
        "Can you review this?",
        "Nice work!",
        "Testing virtual scrolling.",
        "Frontend development.",
        "Real-time chat demo."

    ];

    for(let i=0;i<10000;i++){

        const sender =
        i % 2 === 0
        ? "Alex"
        : "You";

        const text =
        sampleTexts[
            Math.floor(
                Math.random() *
                sampleTexts.length
            )
        ];

        const msg =
        createMessage(
            sender,
            text
        );

        msg.timestamp =
        new Date(
            Date.now()
            -
            (
                (10000-i)
                *
                60000
            )
        );

        messages.push(msg);

    }

}

generateMessages();


// =====================================
// FORMAT TIME
// =====================================

function formatTime(date){

    return date.toLocaleTimeString(
        [],
        {
            hour:"2-digit",
            minute:"2-digit"
        }
    );

}


// =====================================
// RELATIVE TIME
// =====================================

function relativeTime(date){

    const seconds =
    Math.floor(
        (Date.now() -
        date.getTime())
        /1000
    );

    if(seconds < 60)
        return "Just now";

    if(seconds < 3600)
        return Math.floor(
            seconds/60
        ) + " min ago";

    if(seconds < 86400)
        return Math.floor(
            seconds/3600
        ) + " hrs ago";

    return "Yesterday";

}


// =====================================
// INITIAL CONNECTION
// =====================================

connectSocket();

simulateDisconnect();
// =====================================
// RENDER MESSAGE
// =====================================

function createMessageElement(msg, previousMsg) {

    const div = document.createElement("div");

    const isSent = msg.sender === "You";

    div.className =
        `message ${isSent ? "sent" : "received"}`;

    // Message grouping
    if (
        previousMsg &&
        previousMsg.sender === msg.sender
    ) {
        div.classList.add("grouped");
    }

    let statusHTML = "";

    if (isSent) {

        if (msg.status === "sent") {
            statusHTML =
            `<div class="message-status">✓ Sent</div>`;
        }

        if (msg.status === "delivered") {
            statusHTML =
            `<div class="message-status">✓✓ Delivered</div>`;
        }

        if (msg.status === "read") {
            statusHTML =
            `<div class="message-status">🔵 ✓✓ Read</div>`;
        }

    }

    div.innerHTML = `
        <div class="message-text">
            ${msg.text}
        </div>

        <div class="message-time">
            ${relativeTime(msg.timestamp)}
        </div>

        ${statusHTML}

        <div class="reaction-bar"></div>
    `;

    div.dataset.id = msg.id;

    return div;
}


// =====================================
// VIRTUAL RENDER
// =====================================

function renderMessages() {

    messagesWrapper.innerHTML = "";

    const visibleMessages =
    messages.slice(
        visibleStart,
        visibleEnd
    );

    visibleMessages.forEach(
        (msg, index) => {

            const prev =
            visibleMessages[index - 1];

            const el =
            createMessageElement(
                msg,
                prev
            );

            messagesWrapper.appendChild(el);

        }
    );

}


// =====================================
// INITIAL RENDER
// =====================================

visibleStart =
Math.max(
    0,
    messages.length - MAX_RENDER
);

visibleEnd =
messages.length;

renderMessages();

scrollBottom();


// =====================================
// SCROLL TO BOTTOM
// =====================================

function scrollBottom(){

    setTimeout(() => {

        chatContainer.scrollTop =
        chatContainer.scrollHeight;

    },100);

}


// =====================================
// VIRTUAL SCROLLING
// =====================================

chatContainer.addEventListener(
    "scroll",
    () => {

        if(
            chatContainer.scrollTop < 50 &&
            visibleStart > 0
        ){

            visibleStart =
            Math.max(
                0,
                visibleStart - 20
            );

            visibleEnd =
            visibleStart +
            MAX_RENDER;

            renderMessages();

        }

    }
);


// =====================================
// SEND MESSAGE
// =====================================

function sendMessage(){

    const text =
    messageInput.value.trim();

    if(!text) return;

    const msg =
    createMessage(
        "You",
        text
    );

    messages.push(msg);

    visibleStart =
    Math.max(
        0,
        messages.length -
        MAX_RENDER
    );

    visibleEnd =
    messages.length;

    renderMessages();

    scrollBottom();

    messageInput.value = "";

    updateCounter();

    simulateReadReceipt(msg);

    simulateTyping();

}


// =====================================
// BUTTON SEND
// =====================================

sendBtn.addEventListener(
    "click",
    sendMessage
);


// =====================================
// ENTER SUPPORT
// =====================================

messageInput.addEventListener(
    "keydown",
    (e)=>{

        if(
            e.key === "Enter" &&
            !e.shiftKey
        ){

            e.preventDefault();

            sendMessage();

        }

    }
);


// =====================================
// CHARACTER COUNTER
// =====================================

function updateCounter(){

    const len =
    messageInput.value.length;

    charCounter.textContent =
    `${len} / 1000`;

    if(len > 500){

        charCounter.classList.add(
            "warning"
        );

    }else{

        charCounter.classList.remove(
            "warning"
        );

    }

}

messageInput.addEventListener(
    "input",
    updateCounter
);


// =====================================
// READ RECEIPTS
// =====================================

function simulateReadReceipt(msg){

    setTimeout(()=>{

        msg.status =
        "delivered";

        renderMessages();

        scrollBottom();

    },1500);

    setTimeout(()=>{

        msg.status =
        "read";

        renderMessages();

        scrollBottom();

    },3500);

}


// =====================================
// TYPING INDICATOR
// =====================================

function simulateTyping(){

    typingIndicator.classList.remove(
        "hidden"
    );

    setTimeout(()=>{

        receiveMessage();

    },2500);

}


// =====================================
// RECEIVE MESSAGE
// =====================================

function receiveMessage(){

    typingIndicator.classList.add(
        "hidden"
    );

    const replies = [

        "That's awesome!",
        "I agree 👍",
        "Interesting.",
        "Can you explain more?",
        "Looks good.",
        "Great job!",
        "Let's do it.",
        "Perfect 🚀",
        "Okay!",
        "Sounds good."

    ];

    const reply =
    replies[
        Math.floor(
            Math.random()
            *
            replies.length
        )
    ];

    const msg =
    createMessage(
        "Alex",
        reply
    );

    messages.push(msg);

    visibleStart =
    Math.max(
        0,
        messages.length -
        MAX_RENDER
    );

    visibleEnd =
    messages.length;

    renderMessages();

    scrollBottom();

    playNotification();

    showNotification(
        "Alex",
        reply
    );

}


// =====================================
// AUTO UPDATE TIMES
// =====================================

setInterval(()=>{

    renderMessages();

},60000);
// =====================================
// EMOJI PICKER TOGGLE
// =====================================

emojiBtn.addEventListener("click", () => {

    emojiPicker.classList.toggle("hidden");

});

document.addEventListener("click", (e) => {

    if (
        !emojiPicker.contains(e.target) &&
        e.target !== emojiBtn
    ) {
        emojiPicker.classList.add("hidden");
    }

});


// =====================================
// EMOJI REACTIONS
// =====================================

messagesWrapper.addEventListener("dblclick", (e) => {

    const message =
    e.target.closest(".message");

    if (!message) return;

    const reactionBar =
    message.querySelector(".reaction-bar");

    const reaction =
    document.createElement("span");

    reaction.className =
    "reaction";

    reaction.textContent =
    "👍 1";

    reactionBar.appendChild(reaction);

});


// =====================================
// FILE PREVIEW
// =====================================

fileInput.addEventListener(
    "change",
    handleFiles
);

function handleFiles(e){

    const files =
    e.target.files;

    for(
        let file of files
    ){

        const card =
        document.createElement("div");

        card.className =
        "preview-card";

        // image preview

        if(
            file.type.startsWith(
                "image"
            )
        ){

            const reader =
            new FileReader();

            reader.onload =
            function(ev){

                card.innerHTML =
                `
                <img src="${ev.target.result}">
                <p>${file.name}</p>
                `;

            };

            reader.readAsDataURL(
                file
            );

        }else{

            card.innerHTML =
            `
            <strong>${file.name}</strong>
            <br>
            ${(file.size/1024)
            .toFixed(2)}
            KB
            `;

        }

        previewArea.appendChild(
            card
        );

    }

}


// =====================================
// DRAG & DROP
// =====================================

document.addEventListener(
    "dragover",
    (e)=>{
        e.preventDefault();
    }
);

document.addEventListener(
    "drop",
    (e)=>{

        e.preventDefault();

        const files =
        e.dataTransfer.files;

        if(files.length){

            handleDroppedFiles(
                files
            );

        }

    }
);

function handleDroppedFiles(
    files
){

    for(
        let file of files
    ){

        const card =
        document.createElement("div");

        card.className =
        "preview-card";

        card.innerHTML =
        `
        <strong>
        ${file.name}
        </strong>
        <br>
        ${(file.size/1024)
        .toFixed(2)} KB
        `;

        previewArea.appendChild(
            card
        );

    }

}


// =====================================
// SLASH COMMANDS
// =====================================

messageInput.addEventListener(
    "input",
    () => {

        const value =
        messageInput.value;

        if(
            value.startsWith("/")
        ){

            commandPalette
            .classList
            .remove("hidden");

        }else{

            commandPalette
            .classList
            .add("hidden");

        }

    }
);

commandPalette.addEventListener(
    "click",
    (e)=>{

        const command =
        e.target.innerText;

        executeCommand(
            command
        );

        commandPalette
        .classList
        .add("hidden");

    }
);

function executeCommand(cmd){

    switch(cmd){

        case "/help":

            alert(
            `Available Commands

/help
/clear
/theme
/dark
/light`
            );

            break;

        case "/clear":

            messages = [];

            renderMessages();

            break;

        case "/theme":

            document.body.classList.toggle(
                "dark-theme"
            );

            break;

        case "/dark":

            document.body.style.filter =
            "brightness(.85)";

            break;

        case "/light":

            document.body.style.filter =
            "brightness(1)";

            break;
    }

}


// =====================================
// BROWSER NOTIFICATIONS
// =====================================

function showNotification(
    title,
    body
){

    if(
        Notification.permission
        === "granted"
    ){

        const notification =
        new Notification(
            title,
            {
                body
            }
        );

        notification.onclick =
        () => {

            window.focus();

        };

    }

}


// =====================================
// SOUND NOTIFICATION
// =====================================

function playNotification(){

    try{

        notifySound.currentTime = 0;

        notifySound.play();

    }catch(err){

        console.log(err);

    }

}



setInterval(()=>{

    if(
        Math.random() < 0.25
    ){

        receiveMessage();

    }

},30000);



window.addEventListener(
    "offline",
    ()=>{

        updateConnectionUI(
            "disconnected"
        );

    }
);

window.addEventListener(
    "online",
    ()=>{

        connectSocket();

    }
);



updateCounter();



console.log(
"Real-Time Chat UI Loaded"
);
