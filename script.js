document.addEventListener('DOMContentLoaded', () => {
    const termIn = document.getElementById('term-in');
    const termOut = document.getElementById('term-out');
    const packet = document.getElementById('main-packet');
    const stStatus = document.getElementById('st-status');
    const stFrom = document.getElementById('st-from');
    const stTo = document.getElementById('st-to');
    const stMail = document.getElementById('st-mail-content');

    let state = 'INIT';
    let dataLines = [];

    // Funciones globales para los botones de la guía
    window.copyCmd = (cmd) => {
        termIn.value = cmd;
        termIn.focus();
    };

    window.copyDataBlock = () => {
        const block = "Subject: Entrega de Laboratorio - Protocolos de Aplicación\nHola, profesor. \nAdjunto mi simulación del protocolo SMTP para la clase de Redes.\nAtentamente, \nUriel Torres.\n.";
        termIn.value = block;
        termIn.focus();
    };

    termIn.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const val = termIn.value; // No trim here to allow multi-line paste processing
            if (val) processCommand(val);
            termIn.value = '';
        }
    });

    function addLog(txt, cls = '') {
        const div = document.createElement('div');
        div.className = `line ${cls}`;
        div.textContent = txt;
        termOut.appendChild(div);
        termOut.scrollTop = termOut.scrollHeight;
    }

    function animatePacket(callback) {
        packet.classList.remove('anim-p');
        void packet.offsetWidth;
        packet.classList.add('anim-p');
        setTimeout(callback, 600);
    }

    function processCommand(input) {
        // Soporte para múltiples líneas pegadas (Bloque de Datos)
        const commands = input.split('\n');
        
        commands.forEach((cmd, index) => {
            if (cmd === "" && index > 0) return; // Skip empty trailing line from split

            setTimeout(() => {
                const upper = cmd.trim().toUpperCase();
                
                // Si estamos en DATA_MODE, no animamos paquete cada vez, solo guardamos
                if (state === 'DATA_MODE' && cmd.trim() !== '.') {
                    addLog(`> ${cmd}`, 'txt-white');
                    dataLines.push(cmd);
                    stMail.innerHTML = dataLines.join('<br>');
                    return;
                }

                addLog(`> ${cmd}`, 'txt-white');

                animatePacket(() => {
                    let response = '500 5.5.1 Command unrecognized';
                    
                    if (state === 'DATA_MODE' && cmd.trim() === '.') {
                        response = '250 2.0.0 Ok: queued as 7F421C';
                        state = 'QUEUED';
                        stStatus.textContent = 'DELIVERED';
                        document.getElementById('node-mda').style.boxShadow = '0 0 20px #10b981';
                    } else if (upper.startsWith('HELO') || upper.startsWith('EHLO')) {
                        response = '250 smtp.tecsup.edu.pe Hello tecsup.edu.pe [192.168.10.45]';
                        state = 'CONNECTED';
                        stStatus.textContent = 'CONNECTED';
                    } else if (upper.startsWith('MAIL FROM:')) {
                        const email = cmd.match(/<(.+)>/);
                        stFrom.textContent = email ? email[1] : 'Invalid';
                        response = '250 2.1.0 Ok';
                        state = 'SENDER_SET';
                    } else if (upper.startsWith('RCPT TO:')) {
                        const email = cmd.match(/<(.+)>/);
                        stTo.textContent = email ? email[1] : 'Invalid';
                        response = '250 2.1.5 Ok';
                        state = 'RCPT_SET';
                    } else if (upper === 'DATA') {
                        response = '354 End data with <CR><LF>.<CR><LF>';
                        state = 'DATA_MODE';
                        stStatus.textContent = 'RECEIVING_DATA';
                        stMail.textContent = '';
                        dataLines = [];
                    } else if (upper === 'QUIT') {
                        response = '221 2.0.0 Bye';
                        state = 'INIT';
                        stStatus.textContent = 'IDLE';
                        stFrom.textContent = '-';
                        stTo.textContent = '-';
                        stMail.textContent = 'Esperando DATA...';
                        document.getElementById('node-mda').style.boxShadow = 'none';
                    }

                    addLog(response, 'txt-green');
                });
            }, index * 400); // Retraso reducido para bloques grandes
        });
    }
});
