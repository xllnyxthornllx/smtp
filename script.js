document.addEventListener('DOMContentLoaded', () => {
    const terminalInput = document.getElementById('terminal-input');
    const terminalOutput = document.getElementById('terminal-output');
    
    let smtpState = 'INIT'; // INIT, HELO, MAIL, RCPT, DATA, QUIT

    const responses = {
        'HELO': '250 smtp.tecnico.edu.pe Hello client.network.local [192.168.1.10]',
        'EHLO': '250-smtp.tecnico.edu.pe\n250-PIPELINING\n250-SIZE 10240000\n250-ETRN\n250-STARTTLS\n250-ENHANCEDSTATUSCODES\n250-8BITMIME\n250-DSN\n250 CHUNKING',
        'MAIL FROM': '250 2.1.0 Ok',
        'RCPT TO': '250 2.1.5 Ok',
        'DATA': '354 End data with <CR><LF>.<CR><LF>',
        'QUIT': '221 2.0.0 Bye',
        'ERROR': '500 5.5.1 Command unrecognized',
        'SEQUENCE': '503 5.5.1 Error: bad sequence of commands'
    };

    terminalInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const command = terminalInput.value.trim();
            if (command) {
                processCommand(command);
            }
            terminalInput.value = '';
        }
    });

    function addLine(text, type = 'server') {
        const line = document.createElement('div');
        line.className = `line ${type === 'user' ? 'user-input' : ''}`;
        
        // Handle multiline responses
        const lines = text.split('\n');
        lines.forEach(l => {
            const div = document.createElement('div');
            div.textContent = (type === 'user' ? '> ' : '') + l;
            line.appendChild(div);
        });

        terminalOutput.appendChild(line);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

    function processCommand(cmd) {
        const upperCmd = cmd.toUpperCase();
        addLine(cmd, 'user');

        if (smtpState === 'DATA') {
            if (cmd === '.') {
                smtpState = 'HELO';
                setTimeout(() => addLine('250 2.0.0 Ok: queued as 4V9X7Z0123'), 500);
            } else {
                // Just acknowledge data input silently or with a hint
            }
            return;
        }

        if (upperCmd.startsWith('HELO') || upperCmd.startsWith('EHLO')) {
            smtpState = 'HELO';
            addLine(responses[upperCmd.startsWith('HELO') ? 'HELO' : 'EHLO']);
        } 
        else if (upperCmd.startsWith('MAIL FROM:')) {
            if (smtpState === 'HELO') {
                smtpState = 'MAIL';
                addLine(responses['MAIL FROM']);
            } else {
                addLine(responses['SEQUENCE']);
            }
        }
        else if (upperCmd.startsWith('RCPT TO:')) {
            if (smtpState === 'MAIL' || smtpState === 'RCPT') {
                smtpState = 'RCPT';
                addLine(responses['RCPT TO']);
            } else {
                addLine(responses['SEQUENCE']);
            }
        }
        else if (upperCmd === 'DATA') {
            if (smtpState === 'RCPT') {
                smtpState = 'DATA';
                addLine(responses['DATA']);
            } else {
                addLine(responses['SEQUENCE']);
            }
        }
        else if (upperCmd === 'QUIT') {
            smtpState = 'INIT';
            addLine(responses['QUIT']);
            setTimeout(() => {
                addLine('--- Sesión cerrada por el host remoto ---', 'prompt');
                addLine('220 smtp.tecnico.edu.pe ESMTP Postfix');
            }, 1000);
        }
        else if (upperCmd === 'HELP') {
            addLine('Comandos soportados: HELO, MAIL FROM:, RCPT TO:, DATA, QUIT, RSET');
        }
        else {
            addLine(responses['ERROR']);
        }
    }

    // Interactive video placeholder
    const videoPlaceholder = document.querySelector('.video-placeholder');
    if (videoPlaceholder) {
        videoPlaceholder.addEventListener('click', () => {
            videoPlaceholder.innerHTML = '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe>';
        });
    }
});
