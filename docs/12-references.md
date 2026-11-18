# Referensi belajar deployment AWS

Halaman `/guide#referensi` menampilkan 12 sumber dalam tiga kelompok, dengan
ringkasan bahasa Indonesia dan alasan kapan tiap sumber berguna. Judul sumber
dipertahankan dalam bahasa aslinya agar mudah dicari. Ringkasan berikut
merupakan orientasi berdasarkan topik/judul, bukan pengganti isi asli; periksa
langkah teknis, versi, biaya, dan keamanan di sumber sebelum menerapkannya.

## 1. Aplikasi Next.js, Docker, dan server EC2

Cocok untuk memahami cara mengemas aplikasi dan menjalankannya di mesin virtual
EC2. Pembaca baru dapat mulai dari kelompok ini.

| Sumber | Kegunaan |
| --- | --- |
| [Next.js deployment on AWS EC2 with CI/CD using Docker and CodePipeline](https://awstip.com/next-js-deployment-on-aws-ec2-with-ci-cd-using-docker-and-codepipeline-e8a4bb502227) | Memahami hubungan build Next.js, image Docker, EC2, dan alur CodePipeline. |
| [Deploy a Next.js book reader app on AWS with Docker](https://hackernoon.com/how-to-deploy-a-nextjs-book-reader-app-on-aws-with-docker?source=rss#1) | Melihat contoh aplikasi Next.js yang dikemas dengan Docker untuk AWS. |
| [Automate Next.js deployment to AWS EC2 with GitLab CI](https://aws.plainenglish.io/automate-next-js-deployment-to-aws-ec2-with-gitlab-ci-ba0c1459e09f) | Membandingkan otomatisasi deployment EC2 menggunakan GitLab CI. |
| [EC2 backend deployer full guide](https://github.com/shipshitdev/skills/blob/366150f6ff4abf908164df8b94a6a49d65f46295/skills/ec2-backend-deployer/references/full-guide.md) | Panduan dan checklist untuk menyiapkan backend di EC2. |
| [Deploy a Next.js portfolio with Docker, AWS, and CI/CD](https://dev.to/ritesh355/building-deploying-my-nextjs-portfolio-with-docker-aws-and-cicd-54cf#comments#1) | Studi kasus alur proyek dari aplikasi portfolio sampai deployment. |
| [Deploy Next.js to EC2 with Docker, Nginx, and GitHub Actions](https://medium.com/@kilamaelie/deploy-a-next-js-app-on-aws-ec2-with-docker-nginx-and-automate-with-github-actions-05a879d1a81b) | Melihat kombinasi EC2, Docker, Nginx, dan GitHub Actions. |
| [EC2 deployment example](https://gist.github.com/CynthiaWahome/6c417d4ac286223d096a3352ffc190a3) | Contoh konfigurasi ringkas; periksa izin, variabel, dan aturan jaringan sebelum digunakan. |

## 2. Pipeline CI/CD dan arsitektur AWS

CI/CD adalah otomatisasi untuk memeriksa perubahan, membangun aplikasi, dan
mengirim rilis. Gunakan bacaan ini untuk membandingkan pilihan pipeline.

| Sumber | Kegunaan |
| --- | --- |
| [AWS Cloud-Native Architecture Handbook: CodePipeline and CodeBuild](https://codingbbq.github.io/docs/Cloud/AWS-Cloud-Native-Architecture-Handbook/#28-aws-cicd-codepipeline--codebuild) | Memahami peran CodePipeline dan CodeBuild dalam tahapan source, build, dan deployment di AWS. |
| [Build a CI/CD pipeline with Jenkins, Docker, Terraform, and Ansible](https://aws.plainenglish.io/building-a-complete-ci-cd-pipeline-with-jenkins-docker-terraform-and-ansible-4a643489a1c1) | Membandingkan arsitektur otomasi yang menggabungkan Jenkins, container, dan Infrastructure as Code. |

## 3. Terraform, OpenTofu, dan AWS provider

Infrastructure as Code (IaC) berarti mendeskripsikan infrastruktur sebagai
berkas kode agar perubahan dapat ditinjau dan diulang. Provider adalah plugin
yang menghubungkan Terraform/OpenTofu ke API layanan seperti AWS.

| Sumber | Kegunaan |
| --- | --- |
| [OpenTofu AWS provider v6.17.0](https://search.opentofu.org/provider/hashicorp/aws/v6.17.0?lang=python) | Mencari dokumentasi resource dan argumen provider AWS versi 6.17.0. |
| [Terraform AWS provider documentation at a pinned revision](https://github.com/hashicorp/terraform-provider-aws/blob/c23a48ea3fa342114a023f36518bc7ae1a5498ff/website/docs/index.html.markdown) | Membaca dokumentasi Terraform AWS provider pada revisi Git tertentu; isi dapat berbeda dari versi terbaru. |
| [OpenTofu AWS provider v6.7.0](https://search.opentofu.org/provider/hashicorp/aws/v6.7.0) | Membandingkan dokumentasi provider versi 6.7.0 dengan versi yang lebih baru. |

## Cara menerapkan referensi ke lab ini

- Untuk latihan awal, jalankan Next.js dan PostgreSQL 17 pada jaringan Docker
  privat di satu EC2. Port database tidak dibuka ke internet.
- CodePipeline, GitLab CI, Jenkins, dan GitHub Actions adalah pendekatan yang
  berbeda. Workflow repository saat ini memakai GitHub Actions dan GHCR.
- Konfigurator hanya menyimpan pilihan di browser dan menyiapkan berkas lokal
  untuk ditinjau. Ia tidak menghubungi AWS, menjalankan Terraform, membuat
  resource, atau menyertakan perintah `terraform apply`.
- Jika kelak memilih provisioning, tinjau perubahan, biaya, izin, dan dampak
  resource secara terpisah sebelum menjalankan alat infrastruktur.
- Jangan menaruh password, token, atau private key di `*.tfvars`, repository,
  maupun formulir konfigurasi.
