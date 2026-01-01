let editor;
const ws = new WebSocket('ws://localhost:8765');

require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs' } });

require(['vs/editor/editor.main'], function () {
    fetch('/api/css')
        .then(res => res.json())
        .then(data => {
            editor = monaco.editor.create(document.getElementById('container'), {
                value: data.css || '/* Error loading CSS */',
                language: 'css',
                theme: 'vs-dark',
                automaticLayout: true
            });

            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, save);
        });
});

function save() {
    const css = editor.getValue();
    ws.send(JSON.stringify({ type: 'SAVE', css }));

    const btn = document.getElementById('saveBtn');
    const oldText = btn.innerText;
    btn.innerText = "Saved!";
    setTimeout(() => btn.innerText = oldText, 1000);
}
