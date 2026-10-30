# Jump Quest — Android

Game platformer 2D bergaya kartun, dibuat dengan HTML5 Canvas dan dibungkus menjadi aplikasi Android WebView. Tidak membutuhkan API, akun, atau aset eksternal.

## Fitur
- Kontrol sentuh: kiri/kanan di kiri layar, lompat di kanan.
- Gerakan dengan akselerasi, gravitasi, coyote-time, jump-buffer, tabrakan dinding platform, kamera mengikuti pemain, dan animasi karakter.
- Layar otomatis diskalakan ke tinggi 540 unit, jadi tampilan sama di semua ukuran HP (landscape).
- Multitouch: bisa menahan arah sambil menekan JUMP; tombol Back Android menjeda game / kembali ke menu sebelumnya.
- Lobby, pilihan karakter, pilihan dunia, pilihan level, jeda, koin, musuh patroli, duri, jurang, bendera checkpoint (respawn di checkpoint terakhir), dan gerbang akhir.
- 10 dunia × 20 level = 200 level yang dibuat secara prosedural.
- Progress level dan karakter tersimpan di perangkat melalui localStorage.
- APK debug otomatis dibuat oleh GitHub Actions.

## Build APK melalui GitHub
1. Buat repository baru di GitHub.
2. Upload seluruh isi folder project ini (bukan folder ZIP-nya) ke repository.
3. Buka tab **Actions** dan izinkan Actions jika diminta.
4. Pilih workflow **Build Android APK**, lalu tekan **Run workflow**. Workflow juga berjalan otomatis saat push ke `main` atau `master`.
5. Setelah selesai, buka hasil run → **Artifacts** → unduh `JumpQuest-debug-apk`.
6. Ekstrak ZIP artifact, lalu instal `app-debug.apk` di Android. Jika Android meminta izin, izinkan instalasi dari sumber tersebut.

## Catatan
- APK yang dihasilkan adalah **debug APK** untuk instalasi dan pengujian, bukan APK release bertanda tangan untuk Play Store.
- Untuk update, unggah perubahan source ke GitHub lalu jalankan workflow lagi.
- Jika ingin nama/icon/package ID diubah, ubah `app/build.gradle`, `AndroidManifest.xml`, dan aset terkait.
