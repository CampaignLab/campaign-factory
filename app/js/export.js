/* Per-document export: Markdown, plain text, print/PDF, copy.
   Exports the CURRENT DOM (including the user's edits). */

(function () {
  function domToMarkdown(root) {
    let out = "";
    function walk(node, ctx) {
      for (const el of node.children) {
        const t = el.tagName;
        if (t === "H1") out += "# " + el.innerText.trim() + "\n\n";
        else if (t === "H2") out += "## " + el.innerText.trim() + "\n\n";
        else if (t === "H3") out += "### " + el.innerText.trim() + "\n\n";
        else if (t === "P" || t === "DIV" && (el.classList.contains("formula") || el.classList.contains("callout") || el.classList.contains("warncall") || el.classList.contains("docmeta")))
          out += el.innerText.trim().replace(/\n{2,}/g, "\n") + "\n\n";
        else if (t === "BLOCKQUOTE") out += el.innerText.trim().split("\n").map(l => "> " + l).join("\n") + "\n\n";
        else if (t === "UL") { for (const li of el.querySelectorAll(":scope > li")) out += "- " + li.innerText.trim() + "\n"; out += "\n"; }
        else if (t === "OL") { let i = 1; for (const li of el.querySelectorAll(":scope > li")) out += (i++) + ". " + li.innerText.trim() + "\n"; out += "\n"; }
        else if (t === "TABLE") {
          const rows = Array.from(el.querySelectorAll("tr"));
          rows.forEach((r, i) => {
            const cells = Array.from(r.children).map(c => c.innerText.trim().replace(/\n+/g, " "));
            out += "| " + cells.join(" | ") + " |\n";
            if (i === 0) out += "|" + cells.map(() => " --- ").join("|") + "|\n";
          });
          out += "\n";
        }
        else if (el.children.length) walk(el, ctx);
        else if (el.innerText && el.innerText.trim()) out += el.innerText.trim() + "\n\n";
      }
    }
    walk(root);
    return out.replace(/\n{3,}/g, "\n\n").trim() + "\n";
  }

  function download(filename, text, mime) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: mime || "text/plain;charset=utf-8" }));
    a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
  }

  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

  window.CF_EXPORT = {
    markdown(sheetEl, docTitle, campaignName) { download(slug(campaignName) + "--" + slug(docTitle) + ".md", domToMarkdown(sheetEl), "text/markdown;charset=utf-8"); },
    text(sheetEl, docTitle, campaignName) { download(slug(campaignName) + "--" + slug(docTitle) + ".txt", sheetEl.innerText); },
    print() { window.print(); }, // print-friendly HTML → PDF via the browser dialog
    async copy(sheetEl) {
      try { await navigator.clipboard.writeText(domToMarkdown(sheetEl)); return true; }
      catch (e) { // clipboard API can be unavailable on file:// — fall back
        const ta = document.createElement("textarea"); ta.value = domToMarkdown(sheetEl);
        document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); return true;
      }
    }
  };
})();
