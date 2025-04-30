let isDarkTheme = true;
let hasRunOnPreview = false;
let lastActiveTab = 'HTML';

function openTab(tabName) {
    var i;
    var tabContent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabContent.length; i++) {
        tabContent[i].style.display = "none";
    }
    var tabButtons = document.getElementsByClassName("tab-button");
    for (i = 0; i < tabButtons.length; i++) {
        tabButtons[i].className = tabButtons[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    var activeButton = Array.from(tabButtons).find(function(btn) {
        return btn.onclick.toString().includes(tabName);
    });
    if (activeButton) {
        activeButton.className += " active";
    }

    if (tabName !== "Preview") {
        lastActiveTab = tabName;
    }

    if (tabName === "Preview") {
        var previewEditorContainer = document.getElementById("previewEditorContainer");
        previewEditorContainer.innerHTML = "";

        // Clona o editor da última aba ativa
        var lastEditor = document.getElementById(lastActiveTab).querySelector(".editor-container").cloneNode(true);
        previewEditorContainer.appendChild(lastEditor);

        document.getElementById("previewEditorTitle").innerText = "Editor " + lastActiveTab;

        var clonedEditor = lastEditor.querySelector(".editor");
        var clonedLines = lastEditor.querySelector(".line-numbers");
        var clonedHighlight = lastEditor.querySelector(".highlight");
        clonedEditor.oninput = function() {
            updateLineNumbers(clonedEditor.id, clonedLines.id);
            highlightCode(clonedEditor.id, clonedHighlight.id);
            document.getElementById(clonedEditor.id).value = clonedEditor.value;
        };
        clonedEditor.onscroll = function() {
            syncScroll(clonedEditor.id, clonedLines.id, clonedHighlight.id);
        };

        if (!hasRunOnPreview) {
            runCode();
            hasRunOnPreview = true;
        }
    }
}

function runCode() {
    var htmlCode = document.getElementById("htmlEditor").value;
    var cssCode = document.getElementById("cssEditor").value;
    var jsCode = document.getElementById("jsEditor").value;
    var output = document.getElementById("output");

    output.innerHTML = "";

    var iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    output.appendChild(iframe);

    var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();

    iframeDoc.write("<!DOCTYPE html>");
    iframeDoc.write("<html>");
    iframeDoc.write("<head>");
    iframeDoc.write("<style>");
    iframeDoc.write("body { background-color: #2c2c2c; color: #e0e0e0; font-family: Arial, sans-serif; }");
    iframeDoc.write(cssCode);
    iframeDoc.write("</style>");
    iframeDoc.write("</head>");
    iframeDoc.write("<body>");
    iframeDoc.write(htmlCode);
    iframeDoc.write("<script>");
    iframeDoc.write("try {");
    iframeDoc.write(jsCode);
    iframeDoc.write("} catch (e) {");
    iframeDoc.write("console.error('Erro no JavaScript: ' + e.message);");
    iframeDoc.write("}");
    iframeDoc.write("</script>");
    iframeDoc.write("</body>");
    iframeDoc.write("</html>");

    iframeDoc.close();
}

function clearOutput() {
    document.getElementById("output").innerHTML = "Pré-visualização aparecerá aqui...";
    hasRunOnPreview = false;
}

function saveCode() {
    var htmlCode = document.getElementById("htmlEditor").value;
    var cssCode = document.getElementById("cssEditor").value;
    var jsCode = document.getElementById("jsEditor").value;
    localStorage.setItem("htmlCode", htmlCode);
    localStorage.setItem("cssCode", cssCode);
    localStorage.setItem("jsCode", jsCode);
    alert("Código salvo com sucesso!");
}

function exportCode() {
    var htmlCode = document.getElementById("htmlEditor").value;
    var cssCode = document.getElementById("cssEditor").value;
    var jsCode = document.getElementById("jsEditor").value;

    var fullCode = "<!DOCTYPE html>\n" +
                   "<html>\n" +
                   "<head>\n" +
                   "<style>\n" +
                   cssCode + "\n" +
                   "</style>\n" +
                   "</head>\n" +
                   "<body>\n" +
                   htmlCode + "\n" +
                   "<script>\n" +
                   jsCode + "\n" +
                   "</script>\n" +
                   "</body>\n" +
                   "</html>";

    var blob = new Blob([fullCode], { type: "text/html" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "exported_code.html";
    a.click();
    URL.revokeObjectURL(url);
}

function loadCode() {
    var htmlCode = localStorage.getItem("htmlCode");
    var cssCode = localStorage.getItem("cssCode");
    var jsCode = localStorage.getItem("jsCode");
    if (htmlCode) {
        document.getElementById("htmlEditor").value = htmlCode;
        highlightCode("htmlEditor", "htmlHighlight");
    }
    if (cssCode) {
        document.getElementById("cssEditor").value = cssCode;
        highlightCode("cssEditor", "cssHighlight");
    }
    if (jsCode) {
        document.getElementById("jsEditor").value = jsCode;
        highlightCode("jsEditor", "jsHighlight");
    }
}

function updateLineNumbers(editorId, linesId) {
    var editor = document.getElementById(editorId);
    var lines = document.getElementById(linesId);
    var lineCount = editor.value.split("\n").length;
    var lineNumbers = "";
    for (var i = 1; i <= lineCount; i++) {
        lineNumbers += i + "\n";
    }
    lines.innerText = lineNumbers;
}

function syncScroll(editorId, linesId, highlightId) {
    var editor = document.getElementById(editorId);
    var lines = document.getElementById(linesId);
    var highlight = document.getElementById(highlightId);
    lines.scrollTop = editor.scrollTop;
    highlight.scrollTop = editor.scrollTop;
    highlight.scrollLeft = editor.scrollLeft;
}

function highlightCode(editorId, highlightId) {
    var editor = document.getElementById(editorId);
    var highlight = document.getElementById(highlightId);
    var code = editor.value;

    var escapedCode = code.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");

    var keywords, strings, comments;
    if (editorId === "htmlEditor") {
        keywords = /\b(html|head|body|div|h1|p|script|style)\b/g;
        strings = /(["'])(.*?)\1/g;
        comments = /<!--[\s\S]*?-->/g;
    } else if (editorId === "cssEditor") {
        keywords = /\b(font-family|text-align|padding|color|font-size)\b/g;
        strings = /(["'])(.*?)\1/g;
        comments = /\/\*[\s\S]*?\*\//g;
    } else {
        keywords = /\b(function|var|let|const|if|else|for|while|try|catch|console|document)\b/g;
        strings = /(["'])(.*?)\1/g;
        comments = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)/gm;
    }

    var highlightedCode = escapedCode;
    highlightedCode = highlightedCode.replace(keywords, '<span class="keyword">$&</span>');
    highlightedCode = highlightedCode.replace(strings, '<span class="string">$&</span>');
    highlightedCode = highlightedCode.replace(comments, '<span class="comment">$&</span>');

    highlight.innerHTML = highlightedCode;
}

function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    var editors = document.getElementsByClassName("editor");
    for (var i = 0; i < editors.length; i++) {
        editors[i].classList.toggle("dark", isDarkTheme);
    }
}

document.addEventListener("keydown", function(event) {
    if (event.ctrlKey && event.key === "Enter") {
        runCode();
        event.preventDefault();
    }
});

window.onload = function() {
    loadCode();
    updateLineNumbers("htmlEditor", "htmlLines");
    updateLineNumbers("cssEditor", "cssLines");
    updateLineNumbers("jsEditor", "jsLines");
    highlightCode("htmlEditor", "htmlHighlight");
    highlightCode("cssEditor", "cssHighlight");
    highlightCode("jsEditor", "jsHighlight");
    document.getElementById("defaultOpen").click();
};
