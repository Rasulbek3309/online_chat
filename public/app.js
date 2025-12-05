const socket = io();

let username = '';
let typingTimeout;

const usernameContainer = document.getElementById('usernameContainer');
const chatContainer = document.getElementById('chatContainer');
const usernameInput = document.getElementById('usernameInput');
const joinBtn = document.getElementById('joinBtn');
const messagesContainer = document.getElementById('messagesContainer');
const messages = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const onlineUsers = document.getElementById('onlineUsers');
const typingIndicator = document.getElementById('typingIndicator');
const themeToggle = document.getElementById('themeToggle');

joinBtn.addEventListener('click', joinChat);
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        joinChat();
    }
});

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

messageInput.addEventListener('input', () => {
    socket.emit('typing');

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        socket.emit('stop typing');
    }, 1000);
});

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    themeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
});

if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    themeToggle.textContent = '☀️';
}

function joinChat() {
    const name = usernameInput.value.trim();

    if (name === '') {
        alert('Iltimos, ismingizni kiriting!');
        return;
    }

    username = name;
    socket.emit('user joined', username);

    usernameContainer.style.display = 'none';
    chatContainer.style.display = 'flex';
    messageInput.focus();
}

function sendMessage() {
    const message = messageInput.value.trim();

    if (message === '') {
        return;
    }

    socket.emit('chat message', { message });
    messageInput.value = '';
    socket.emit('stop typing');
    messageInput.focus();
}

socket.on('message history', (history) => {
    history.forEach(data => {
        displayMessage(data);
    });
});

socket.on('chat message', (data) => {
    displayMessage(data);
    scrollToBottom();
});

socket.on('user notification', (data) => {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = 'notification';

    const time = formatTime(data.timestamp);

    if (data.type === 'join') {
        notificationDiv.textContent = `${data.username} suhbatga qo'shildi - ${time}`;
    } else {
        notificationDiv.textContent = `${data.username} suhbatdan chiqdi - ${time}`;
    }

    messages.appendChild(notificationDiv);
    scrollToBottom();
});

socket.on('update users', (usersList) => {
    onlineUsers.textContent = `${usersList.length} foydalanuvchi onlayn`;
});

socket.on('user typing', (typingUsername) => {
    typingIndicator.textContent = `${typingUsername} yozmoqda...`;
});

socket.on('user stop typing', () => {
    typingIndicator.textContent = '';
});

function displayMessage(data) {
    const messageDiv = document.createElement('div');
    messageDiv.className = data.username === username ? 'message own' : 'message other';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'message-header';

    const usernameSpan = document.createElement('span');
    usernameSpan.textContent = data.username;

    const timeSpan = document.createElement('span');
    timeSpan.textContent = formatTime(data.timestamp);

    headerDiv.appendChild(usernameSpan);
    headerDiv.appendChild(timeSpan);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = data.message;

    messageDiv.appendChild(headerDiv);
    messageDiv.appendChild(contentDiv);

    messages.appendChild(messageDiv);
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
