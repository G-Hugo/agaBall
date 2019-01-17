const global = require('./global');

class ChatClient {
    constructor(params) {
        this.canvas = global.canvas;
        this.socket = global.socket;
        this.mobile = global.mobile;
        this.player = global.player;
        const self = this;
        this.commands = {};
        const input = document.getElementById('chatInput');
        input.addEventListener('keypress', this.sendChat.bind(this));
        input.addEventListener('keyup', function(key) {
            input = document.getElementById('chatInput');
            key = key.which || key.keyCode;
            if (key === global.KEY_ESC) {
                input.value = '';
                self.canvas.cv.focus();
            }
        });
        global.chatClient = this;
    }

    // commande de chat

    registerFunctions() {
        const self = this;
        this.registerCommand('ping', 'Verifie la latence.', function () {
            self.checkLatency();
        });

        this.registerCommand('mass', 'Regarde ton poids', function () {
            self.toggleMass();
        });

        this.registerCommand('help', 'Info sur les commandes', function () {
            self.printHelp();
        });

        this.registerCommand('login', 'login admin', function (args) {
            self.socket.emit('pass', args);
        });

        this.registerCommand('kick', 'Kick un joueur', function (args) {
            self.socket.emit('kick', args);
        });
        global.chatClient = this;
    }

    //Ajout chat box.
    addChatLine(name, message, me) {
        if (this.mobile) {
            return;
        }
        const newline = document.createElement('li');

        newline.className = (me) ? 'me' : 'friend';
        newline.innerHTML = '<b>' + ((name.length < 1) ? 'An unnamed cell' : name) + '</b>: ' + message;

        this.appendMessage(newline);
    }

    addSystemLine(message) {
        if (this.mobile) {
            return;
        }
        const newline = document.createElement('li');

        newline.className = 'system';
        newline.innerHTML = message;

        this.appendMessage(newline);
    }

    appendMessage(node) {
        if (this.mobile) {
            return;
        }
        const chatList = document.getElementById('chatList');
        if (chatList.childNodes.length > 10) {
            chatList.removeChild(chatList.childNodes[0]);
        }
        chatList.appendChild(node);
    }

    // Envoie du mesaage
    sendChat(key) {
        const commands = this.commands,
            input = document.getElementById('chatInput');

        key = key.which || key.keyCode;

        if (key === global.KEY_ENTER) {
            const text = input.value.replace(/(<([^>]+)>)/ig,'');
            if (text !== '') {

                // commande de chat
                if (text.indexOf('-') === 0) {
                    const args = text.substring(1).split(' ');
                    if (commands[args[0]]) {
                        commands[args[0]].callback(args.slice(1));
                    } else {
                        this.addSystemLine('Unrecognized Command: ' + text + ', type -help for more info.');
                    }

                } else {
                    this.socket.emit('playerChat', { sender: this.player.name, message: text });
                    this.addChatLine(this.player.name, text, true);
                }

                input.value = '';
                this.canvas.cv.focus();
            }
        }
    }

    // Autorisation commande
    registerCommand(name, description, callback) {
        this.commands[name] = {
            description: description,
            callback: callback
        };
    }

    printHelp() {
        const commands = this.commands;
        for (const cmd in commands) {
            if (commands.hasOwnProperty(cmd)) {
                this.addSystemLine('-' + cmd + ': ' + commands[cmd].description);
            }
        }
    }

    checkLatency() {
        // Ping.
        global.startPingTime = Date.now();
        this.socket.emit('pingcheck');
    }

    toggleMass() {
        if (global.toggleMassState === 0) {
            global.toggleMassState = 1;
            this.addSystemLine('Viewing mass enabled.');
        } else {
            global.toggleMassState = 0;
            this.addSystemLine('Viewing mass disabled.');
        }
    }
}

module.exports = ChatClient;
