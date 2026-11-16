/* ==========================================
   MODUL 10 - CUSTOM ELEMENTS
   Komponen: <salam-pengguna>, <kartu-artikel>,
             <kartu-komentar>, <tombol-tema>
   Dimuat SEBELUM script.js agar komponen sudah terdaftar.
   // Kerangka HTML dibuat menggunakan innerHTML.
    // Data dari API dan pengguna dimasukkan melalui textContent agar aman.
   ========================================== */

/* ---------- Langkah 1: <salam-pengguna> ---------- */
class SalamPengguna extends HTMLElement {
    connectedCallback() {
        const nama = this.getAttribute("nama") || "Tamu";
        this.textContent = `Halo, ${nama}! Selamat datang di blog.`;
    }
}
customElements.define("salam-pengguna", SalamPengguna);

/* ---------- Langkah 2-5: <kartu-artikel> ---------- */
class KartuArtikel extends HTMLElement {
    #like = 0;
    #siap = false;

    static get observedAttributes() {
        return ["judul", "isi", "batas-like"];
    }

    connectedCallback() {
        // Nilai awal like dibaca sekali (aman bila connectedCallback terpanggil ulang)
        if (!this.#siap) {
            const awal = Number(this.getAttribute("like"));
            this.#like = Number.isSafeInteger(awal) && awal >= 0 ? awal : 0;
            this.#siap = true;
        }
        this.render();
    }

    disconnectedCallback() {
        console.log("kartu-artikel dilepas");
    }

    attributeChangedCallback() {
        if (this.isConnected) this.render();
    }

    #batasTercapai() {
        const batas = Number(this.getAttribute("batas-like"));
        return Number.isFinite(batas) && batas > 0 && this.#like >= batas;
    }

    render() {
        // Kerangka tetap; data diisi lewat textContent (aman dari XSS)
        this.innerHTML = `<article class="kartu"><h3></h3><p></p>
            <div class="tombol-pengalaman">
                <button type="button" class="tombol-like btn-like"></button>
                <button type="button" class="tombol-hapus btn-hapus">Hapus</button>
            </div></article>`;

        this.querySelector("h3").textContent = this.getAttribute("judul") ?? "";
        this.querySelector("p").textContent = this.getAttribute("isi") ?? "";

        const like = this.querySelector(".btn-like");
        const perbaruiLike = () => {
            like.textContent = `Like (${this.#like})`;
            like.disabled = this.#batasTercapai();
            if (like.disabled) like.title = "Batas like tercapai";
        };
        perbaruiLike();

        like.addEventListener("click", () => {
            if (this.#batasTercapai()) return;
            this.#like++;
            perbaruiLike();
            // Beri tahu halaman (untuk localStorage & PATCH ke server)
            this.dispatchEvent(new CustomEvent("like-berubah", {
                bubbles: true,
                detail: { jumlah: this.#like }
            }));
        });

        this.querySelector(".btn-hapus")
            .addEventListener("click", () => this.remove());
    }
}
customElements.define("kartu-artikel", KartuArtikel);

/* ---------- Mandiri 1: <kartu-komentar> ---------- */
class KartuKomentar extends HTMLElement {
    static get observedAttributes() {
        return ["nama", "pesan"];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        if (this.isConnected) this.render();
    }

    render() {
        this.innerHTML = `<div class="item-komentar">
            <span class="komentar-text"></span>
            <div class="aksi-komentar">
                <button type="button" class="edit-komentar">Edit</button>
                <button type="button" class="hapus-komentar">Hapus</button>
            </div></div>`;

        const nama = this.getAttribute("nama") ?? "";
        const pesan = this.getAttribute("pesan") ?? "";
        this.querySelector(".komentar-text").textContent = `${nama}: ${pesan}`;

        // Penghapusan melibatkan server (DELETE), jadi komponen hanya
        // melapor; halaman yang memutuskan kapan kartu dilepas.
        this.querySelector(".edit-komentar").addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("edit-komentar", { bubbles: true }));
        });
        this.querySelector(".hapus-komentar").addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("hapus-komentar", { bubbles: true }));
        });
    }
}
customElements.define("kartu-komentar", KartuKomentar);

/* ---------- Mandiri 2: <tombol-tema> ---------- */
class TombolTema extends HTMLElement {
    #tombol = null;
    #onKey = (event) => {
        const aktif = document.activeElement;
        const tag = aktif ? aktif.tagName : "";
        const mengetik = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" ||
            (aktif && aktif.isContentEditable);

        if (event.key.toLowerCase() === "d" && !event.ctrlKey && !event.altKey &&
            !event.metaKey && !event.repeat && !mengetik) {
            this.#ganti();
        }
    };

    connectedCallback() {
        if (!this.#tombol) {
            this.innerHTML = `<button id="btn-tema" type="button"></button>`;
            this.#tombol = this.querySelector("button");
            this.#tombol.addEventListener("click", () => this.#ganti());
        }

        let tema = null;
        try { tema = localStorage.getItem("tema"); } catch (e) { console.error(e); }
        document.body.classList.toggle("dark-mode", tema === "dark");
        this.#perbaruiTeks();

        // Pintasan keyboard D (dipasang saat masuk, dilepas saat keluar dokumen)
        document.addEventListener("keydown", this.#onKey);
    }

    disconnectedCallback() {
        document.removeEventListener("keydown", this.#onKey);
    }

    #ganti() {
        const gelap = document.body.classList.toggle("dark-mode");
        try {
            localStorage.setItem("tema", gelap ? "dark" : "light");
        } catch (e) {
            console.error("Gagal menyimpan tema:", e);
        }
        this.#perbaruiTeks();
    }

    #perbaruiTeks() {
        this.#tombol.textContent = document.body.classList.contains("dark-mode")
            ? "☀️ Mode Terang"
            : "🌙 Mode Gelap";
    }
}
customElements.define("tombol-tema", TombolTema);
