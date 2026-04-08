document.addEventListener('DOMContentLoaded', () => {
    const terminalInput = document.getElementById('terminal-input');
    const terminalOutput = document.getElementById('terminal-output');
    const packet = document.getElementById('data-packet');
    const protocolDesc = document.getElementById('protocol-description');
    const muaState = document.getElementById('mua-state');
    const mtaState = document.getElementById('mta-state');
    const connDot = document.getElementById('connection-dot');
    const connStatus = document.getElementById('connection-status');

    let smtpState = 'INIT';

    const techInfo = {
        'INIT': 'Esperando inicio de sesión. El cliente debe identificarse con el comando <strong>HELO</strong> o <strong>EHLO</strong>.',
        'HELO': 'Handshake completado. La conexión está establecida. Ahora el cliente debe especificar el remitente con <strong>MAIL FROM:</strong>.',
        'MAIL': 'Remitente aceptado por el MTA. El sistema espera el destinatario con el comando <strong>RCPT TO:</strong>.',
        'RCPT': 'Destinatario verificado. El servidor está listo para recibir el cuerpo del mensaje. Use el comando <strong>DATA</strong>.',
        'DATA_START': 'Modo de transferencia de datos activo. Escriba el mensaje y termine con un punto <strong>(.)</strong> en una línea sola.',
        'DATA_END': 'Mensaje encolado (Queued). El ciclo de envío ha terminado con éxito.',
        'QUIT': 'Cerrando conexión TCP. El canal de comunicación se libera.'
    };

    const serverResponses = {
        'HELO': '250 smtp.tecnico.edu.pe Hello client.network.local',
        'MAIL FROM': '250 2.1.0 Sender OK',
        'RCPT TO': '250 2.1.5 Recipient OK',
        'DATA': '354 End data with <CR><LF>.<CR><LF>',
        'QUIT': '221 2.0.0 Service closing transmission channel'
    };

    terminalInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const cmd = terminalInput.value.trim();
            if (cmd) processCommand(cmd);
            terminalInput.value = '';
        }
    });

    function animatePacket(direction, callback) {
        packet.classList.remove('animate-send', 'animate-receive');
        void packet.offsetWidth; // Trigger reflow
        packet.classList.add(direction === 'to-server' ? 'animate-send' : 'animate-receive');
        if (callback) setTimeout(callback, 800);
    }

    function addLine(text, type = 'user') {
        const line = document.createElement('div');
        line.className = `line ${type === 'user' ? 'user-input' : 'response'}`;
        line.textContent = (type === 'user' ? '> ' : '') + text;
        terminalOutput.appendChild(line);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

    function updateVisuals(state, descKey) {
        smtpState = state;
        protocolDesc.innerHTML = techInfo[descKey || state];
        
        // Update statuses
        if (state !== 'INIT' && state !== 'QUIT') {
            connDot.classList.add('online');
            connStatus.textContent = 'ESTABLISHED (TCP 25)';
            mtaState.textContent = 'BUSY';
            mtaState.style.color = 'var(--primary)';
        } else {
            connDot.classList.remove('online');
            connStatus.textContent = 'DISCONNECTED';
            mtaState.textContent = 'LISTENING';
            mtaState.style.color = 'inherit';
        }
    }

    function processCommand(cmd) {
        const upper = cmd.toUpperCase();
        addLine(cmd, 'user');
        
        // Phase 1: Client sends command
        muaState.textContent = 'SENDING...';
        animatePacket('to-server', () => {
            muaState.textContent = 'AWAITING ACK';
            
            // Phase 2: Server processes and responds
            setTimeout(() => {
                let response = '500 5.5.1 Command unrecognized';
                let valid = false;

                if (smtpState === 'DATA') {
                    if (cmd === '.') {
                        response = '250 2.0.0 Ok: queued as 7F321';
                        updateVisuals('HELO', 'DATA_END');
                        valid = true;
                    } else {
                        return; // Silent during DATA input
                    }
                } else if (upper.startsWith('HELO') || upper.startsWith('EHLO')) {
                    response = serverResponses['HELO'];
                    updateVisuals('HELO');
                    valid = true;
                } else if (upper.startsWith('MAIL FROM:')) {
                    if (smtpState === 'HELO') {
                        response = serverResponses['MAIL FROM'];
                        updateVisuals('MAIL');
                        valid = true;
                    } else response = '503 5.5.1 Error: send HELO/EHLO first';
                } else if (upper.startsWith('RCPT TO:')) {
                    if (smtpState === 'MAIL' || smtpState === 'RCPT') {
                        response = serverResponses['RCPT TO'];
                        updateVisuals('RCPT');
                        valid = true;
                    } else response = '503 5.5.1 Error: need MAIL command';
                } else if (upper === 'DATA') {
                    if (smtpState === 'RCPT') {
                        response = serverResponses['DATA'];
                        updateVisuals('DATA', 'DATA_START');
                        valid = true;
                    } else response = '503 5.5.1 Error: need RCPT command';
                } else if (upper === 'QUIT') {
                    response = serverResponses['QUIT'];
                    updateVisuals('INIT', 'QUIT');
                    valid = true;
                }

                animatePacket('to-client', () => {
                    addLine(response, 'server');
                    muaState.textContent = valid ? 'CONNECTED' : 'IDLE';
                });
            }, 400);
        });
    }
});
