import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionSheetController, NavController, Platform, ToastController } from '@ionic/angular';
import { OrdemServicoService } from '../../services/ordem-servico.service';

@Component({
  selector: 'app-ordem-servico-nova-foto',
  templateUrl: './ordem-servico-nova-foto.page.html',
  styleUrls: ['./ordem-servico-nova-foto.page.scss'],
  standalone: false   // <<< IMPORTANTE: NÃO PODE SER true
})
export class OrdemServicoNovaFotoPage {
  fotoBase64: string | null = null;
  foto: string | null = null;
  fotoFile: File | null = null;
  // Mantém a foto original (normalmente maior) apenas para envio à API.
  // O preview/cache usa um dataURL menor para não estourar o limite do localStorage.
  private fotoDataUrlUpload: string | null = null;
  osId: string = '';
  osCod: string = '';
  statusCodigo: number = 1;  // 🔥 NOVO

  private getFotoCacheKeyById(osId: string) {
    return `os:lastFotoDataUrl:id:${osId}`;
  }

  private getFotoIdCacheKeyById(osId: string) {
    return `os:lastFotoId:id:${osId}`;
  }

  private getFotoCacheKeyByCod(osCod: string) {
    return `os:lastFotoDataUrl:cod:${osCod}`;
  }

  private getFotoIdCacheKeyByCod(osCod: string) {
    return `os:lastFotoId:cod:${osCod}`;
  }

  // Chaves antigas (compat)
  private getLegacyFotoCacheKey(osId: string) {
    return `os:lastFotoDataUrl:${osId}`;
  }

  private getLegacyFotoIdCacheKey(osId: string) {
    return `os:lastFotoId:${osId}`;
  }

  private getFotosCacheKeyById(osId: string) {
    return `os:fotos:id:${osId}`;
  }

  private getFotosCacheKeyByCod(osCod: string) {
    return `os:fotos:cod:${osCod}`;
  }

  private appendFotoNoCache(dataUrl: string, fotoId?: string) {
    const osId = this.osId;
    const osCod = this.osCod;

    const purgeOsFotoCaches = (): number => {
      // Remove somente caches relacionados a fotos de OS (não mexe em outras partes do app).
      const prefixes = [
        'os:fotos:id:',
        'os:fotos:cod:',
        'os:lastFotoDataUrl:id:',
        'os:lastFotoDataUrl:cod:',
        'os:lastFotoDataUrl:',
        'os:lastFotoId:id:',
        'os:lastFotoId:cod:',
        'os:lastFotoId:',
      ];

      let removed = 0;
      try {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k) keys.push(k);
        }
        for (const k of keys) {
          if (prefixes.some(p => k.startsWith(p))) {
            try {
              localStorage.removeItem(k);
              removed++;
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // ignore
      }
      return removed;
    };

    const safeSet = (key: string, value: string): boolean => {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch {
        // Se estourou quota, tenta liberar espaço removendo caches antigos de fotos e tenta uma vez de novo.
        try {
          const removed = purgeOsFotoCaches();
          if (removed > 0) {
            localStorage.setItem(key, value);
            return true;
          }
        } catch {
          // ignore
        }
        return false;
      }
    };

    const normalize = (raw: string): string => {
      if (raw.startsWith('data:')) return raw;
      const looksLikeBase64 = /^[A-Za-z0-9+/=\r\n]+$/.test(raw);
      return looksLikeBase64 ? `data:image/jpeg;base64,${raw}` : raw;
    };

    type FotoCacheItem = { id?: string; dataUrl: string; createdAt: string };

    const load = (): FotoCacheItem[] => {
      try {
        const rawById = osId && osId.length === 36 ? localStorage.getItem(this.getFotosCacheKeyById(osId)) : null;
        const rawByCod = osCod ? localStorage.getItem(this.getFotosCacheKeyByCod(osCod)) : null;
        const raw = rawById || rawByCod;
        if (!raw) return [];
        const arr = JSON.parse(raw) as Array<Partial<FotoCacheItem>>;
        if (!Array.isArray(arr)) return [];
        return arr
          .filter(x => typeof x?.dataUrl === 'string' && String(x.dataUrl).trim() !== '')
          .map(x => ({
            id: typeof x.id === 'string' ? x.id : undefined,
            dataUrl: String(x.dataUrl),
            createdAt: typeof x.createdAt === 'string' ? x.createdAt : new Date().toISOString(),
          }));
      } catch {
        return [];
      }
    };

    const fotos = load();
    fotos.push({
      id: fotoId,
      dataUrl: normalize(dataUrl),
      createdAt: new Date().toISOString(),
    });

    // Tenta persistir; se estourar quota, remove as mais antigas até caber.
    const persistList = (items: FotoCacheItem[]) => {
      const payload = JSON.stringify(items);
      let ok = true;
      if (osId && osId.length === 36) {
        ok = safeSet(this.getFotosCacheKeyById(osId), payload) && ok;
      }
      if (osCod) {
        ok = safeSet(this.getFotosCacheKeyByCod(osCod), payload) && ok;
      }
      return ok;
    };

    // Primeira tentativa
    let ok = persistList(fotos);
    if (!ok) {
      // Se falhar, mantém só as últimas N (começa em 10 e vai reduzindo)
      const maxCandidates = [10, 5, 3, 1];
      for (const max of maxCandidates) {
        const sliced = fotos.slice(-max);
        ok = persistList(sliced);
        if (ok) break;
      }
    }
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private actionSheetCtrl: ActionSheetController,
    private navCtrl: NavController,
    private platform: Platform,
    private ordemService: OrdemServicoService,
    private toastCtrl: ToastController,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ionViewWillEnter() {
    // Recebe o OsId (GUID) vindo da tela de edição
    this.route.queryParams.subscribe((params) => {

      this.statusCodigo = Number(params?.['status']) || 1; //  NOVO

      // Sempre inicia com o campo/preview vazio (a foto salva fica na tela de edição).
      this.fotoBase64 = null;
      this.foto = null;
      this.fotoFile = null;
      this.fotoDataUrlUpload = null;

      const pickFirst = (...values: Array<unknown>): string => {
        for (const v of values) {
          const s = String(v ?? '').trim();
          if (s !== '' && s !== 'null' && s !== 'undefined') return s;
        }
        return '';
      };

      const maybeJson = pickFirst(params?.['os']);
      if (maybeJson.startsWith('{') && maybeJson.endsWith('}')) {
        try {
          const obj = JSON.parse(maybeJson) as Record<string, unknown>;
          this.osId = pickFirst(obj['OsId'], obj['osId'], obj['IdOs'], obj['id'], params?.['osId'], params?.['OsId'], params?.['IdOs']);
          this.osCod = pickFirst(obj['osCod'], obj['NumeroOs'], obj['numeroOs'], obj['OsCod'], params?.['osCod'], params?.['OsCod'], params?.['NumeroOs']);
        } catch {
          // segue fluxo normal
        }
      } else {
        // Formatos suportados:
        // - novo: ?osId=<guid>&osCod=<numero>
        // - legado: ?os=<guid>
        this.osId = pickFirst(params?.['osId'], params?.['OsId'], params?.['IdOs'], params?.['os']);
        this.osCod = pickFirst(params?.['osCod'], params?.['OsCod'], params?.['NumeroOs'], params?.['numeroOs']);
      }

      // Se não tem OS válida (nova OS), não carrega nenhuma foto do cache!
      if (!this.osId || this.osId.length !== 36) {
        this.fotoBase64 = null;
        this.foto = null;
        this.fotoFile = null;
        this.fotoDataUrlUpload = null;
        return;
      }

      // Se entrou no formato legado (só GUID), tenta descobrir o código/número via API.
      if (this.osId && this.osId.length === 36 && !this.osCod) {
        this.ordemService.buscarOSPorId(this.osId).subscribe({
          next: (res) => {
            const first = Array.isArray(res) ? res[0] : undefined;
            const cod = first?.osCod ?? first?.NumeroOs ?? first?.numeroOs;
            if (cod !== null && cod !== undefined && String(cod).trim() !== '') {
              this.osCod = String(cod);
            }
          },
          error: () => {
            // sem toast aqui: não bloquear a tela; o confirmarFoto já valida.
          }
        });
      }
    });
  }

  ionViewDidLeave() {
    // Quando sair da tela, limpa também (evita reaproveitar preview antigo)
    this.fotoBase64 = null;
    this.foto = null;
    this.fotoFile = null;
    this.fotoDataUrlUpload = null;
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error ?? new Error('Erro ao ler arquivo.'));
      reader.readAsDataURL(file);
    });
  }

  private async criarPreviewDataUrl(file: File, opts?: { maxDim?: number; quality?: number }): Promise<string> {
    // Preview é SEMPRE comprimido para caber no localStorage.
    const maxDim = opts?.maxDim ?? 480;
    const quality = opts?.quality ?? 0.55;

    const objectUrl = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = 'async';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Erro ao carregar imagem.'));
        img.src = objectUrl;
      });

      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if (!w || !h) {
        return this.readFileAsDataUrl(file);
      }

      const scale = Math.min(1, maxDim / Math.max(w, h));
      const targetW = Math.max(1, Math.round(w * scale));
      const targetH = Math.max(1, Math.round(h * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return this.readFileAsDataUrl(file);
      }

      ctx.drawImage(img, 0, 0, targetW, targetH);
      // Para padronizar e reduzir tamanho, salva como JPEG.
      return canvas.toDataURL('image/jpeg', quality);
    } finally {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        // ignore
      }
    }
  }

  private persistirUltimaFotoAnexada(dataUrl: string, fotoId?: string) {
    const safeSet = (key: string, value: string) => {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    };

    try {
      if (this.osId && this.osId.length === 36) {
        safeSet(this.getFotoCacheKeyById(this.osId), dataUrl);
        safeSet(this.getLegacyFotoCacheKey(this.osId), dataUrl);
        if (fotoId) {
          safeSet(this.getFotoIdCacheKeyById(this.osId), fotoId);
          safeSet(this.getLegacyFotoIdCacheKey(this.osId), fotoId);
        }
      }
      if (this.osCod) {
        safeSet(this.getFotoCacheKeyByCod(this.osCod), dataUrl);
        if (fotoId) {
          safeSet(this.getFotoIdCacheKeyByCod(this.osCod), fotoId);
        }
      }
    } catch {
      // ignore (quota/localStorage indisponível)
    }
  }

  private async toast(message: string, color: 'success' | 'warning' | 'danger' = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'top',
      color,
    });
    await toast.present();
  }

  private getPureBase64(dataUrlOrBase64: string): string {
    const marker = 'base64,';
    const idx = dataUrlOrBase64.indexOf(marker);
    return idx >= 0 ? dataUrlOrBase64.substring(idx + marker.length) : dataUrlOrBase64;
  }

  private getErrorMessage(err: unknown): string {
    if (typeof err === 'string') return err;
    if (!err || typeof err !== 'object') return 'Erro ao enviar foto.';

    const e = err as Record<string, unknown>;
    const message = e['message'];
    if (typeof message === 'string' && message.trim() !== '') return message;

    const errorObj = e['error'];
    if (errorObj && typeof errorObj === 'object') {
      const eo = errorObj as Record<string, unknown>;
      const mensagem = eo['Mensagem'];
      if (typeof mensagem === 'string' && mensagem.trim() !== '') return mensagem;

      // ASP.NET validation errors (400)
      const title = eo['title'];
      if (typeof title === 'string' && title.trim() !== '') {
        const errors = eo['errors'];
        if (errors && typeof errors === 'object') {
          const errs = errors as Record<string, unknown>;
          for (const key of Object.keys(errs)) {
            const v = errs[key];
            if (Array.isArray(v) && typeof v[0] === 'string' && v[0].trim() !== '') {
              return `${key}: ${v[0]}`;
            }
            if (typeof v === 'string' && v.trim() !== '') {
              return `${key}: ${v}`;
            }
          }
        }
        return title;
      }
    }

    return 'Erro ao enviar foto.';
  }

  // volta para a tela de defeitos/causas (aba FOTOS)
  onBack() {
    // Importante: usar back para não perder o contexto (OS carregada) na tela anterior.
    // Se navegar direto para a edição sem parâmetros, ela abre como “nova OS” e some a lista de fotos.
    this.navCtrl.back();
  }

  // Abre ActionSheet com opções de foto
  async localizarFoto() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Selecionar foto',

          // >>> ALTERAÇÃO 1 (VISUAL DO CARD)
    cssClass: 'os-photo-sheet',
    mode: 'ios',

      buttons: [
        {
          text: 'Câmera',
          icon: 'camera',
          handler: () => {
            this.abrirCamera();
          }
        },
        {
          text: 'Galeria',
          icon: 'image',
          handler: () => {
            this.abrirArquivo();
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  private abrirFilePicker(options?: { capture?: 'environment' | 'user' }) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    // Alguns navegadores/webviews (principalmente mobile) são mais confiáveis
    // quando o input está no DOM (mesmo invisível).
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    input.style.opacity = '0';

    // Em web/capacitor/cordova, isso normalmente abre a câmera quando capture está setado.
    if (options?.capture) {
      input.setAttribute('capture', options.capture);
    }

    const cleanup = () => {
      try {
        if (input.parentNode) input.parentNode.removeChild(input);
      } catch {
        // ignore
      }
    };

    // Garante que o input está no DOM antes do click.
    try {
      document.body.appendChild(input);
    } catch {
      // ignore
    }

    input.addEventListener(
      'change',
      (event: Event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
          cleanup();
          return;
        }

        // Esse handler pode ocorrer fora do Angular.
        this.zone.run(() => {
          this.fotoFile = file;
          this.fotoBase64 = null;
          this.foto = null;
          this.fotoDataUrlUpload = null;
          this.cdr.detectChanges();
        });

        (async () => {
          try {
            // 1) dataURL original para envio
            const uploadDataUrl = await this.readFileAsDataUrl(file);
            // 2) preview menor para mostrar/cache
            const previewDataUrl = await this.criarPreviewDataUrl(file);

            this.zone.run(() => {
              this.fotoDataUrlUpload = uploadDataUrl;
              this.fotoBase64 = previewDataUrl;
              this.foto = previewDataUrl;
              this.cdr.detectChanges();
            });
          } catch {
            // fallback: tenta ao menos mostrar algo
            try {
              const fallbackDataUrl = await this.readFileAsDataUrl(file);
              this.zone.run(() => {
                this.fotoDataUrlUpload = fallbackDataUrl;
                this.fotoBase64 = fallbackDataUrl;
                this.foto = fallbackDataUrl;
                this.cdr.detectChanges();
              });
            } catch {
              // ignore
            }
          } finally {
            cleanup();
          }
        })();
      },
      { once: true }
    );

    // O click precisa acontecer como resultado direto da ação do usuário.
    input.click();
  }

  abrirCamera() {
    this.abrirFilePicker({ capture: 'environment' });
  }

  abrirArquivo() {
    this.abrirFilePicker();
  }

  // confirmar inclusão da foto
 confirmarFoto() {

  const dataUrlUpload = this.fotoDataUrlUpload || this.fotoBase64 || this.foto;
  const dataUrlCache = this.fotoBase64 || this.foto;

  if (!this.osId || this.osId.length !== 36) {
    this.toast('OS sem identificador (OsId). Salve a OS antes de anexar foto.', 'warning');
    return;
  }

  if (!dataUrlUpload || !dataUrlCache) {
    this.toast('Selecione uma foto antes de confirmar.', 'warning');
    return;
  }

  const base64 = this.getPureBase64(dataUrlUpload);

  // 🔥 1️⃣ Salva foto
 // 🔥 1️⃣ Salva foto
this.ordemService.gravarOrdemServicoFoto(
  this.osId,
  base64,
  undefined,
  this.osCod
).subscribe({

  next: (res) => {

    const returnedId = String(res ?? '')
      .replace(/^"|"$/g, '')
      .trim();

    const fotoId =
      returnedId && returnedId.length === 36
        ? returnedId
        : undefined;

    this.appendFotoNoCache(dataUrlCache!, fotoId);
    this.persistirUltimaFotoAnexada(dataUrlCache!, fotoId);

    // 🔥 2️⃣ Busca OS atual COMPLETA
    this.ordemService.buscarOSPorId(this.osId).subscribe({

      next: (osArray: any) => {

        const os = Array.isArray(osArray) ? osArray[0] : osArray;

        if (!os) {
          this.toast('Foto enviada, mas não foi possível atualizar o status.', 'warning');
          return;
        }

        // 🔥 3️⃣ Monta payload COMPLETO preservando todos os campos
// 🔥 3️⃣ Monta payload COMPLETO corretamente mapeado
const payloadCompleto =
  this.ordemService.montarPayloadOrdemServico({

    OsId: this.osId,

    Descricao: os.osDescricao ?? os.Descricao ?? '',
    EquipamentoId: os.equipId ?? os.EquipamentoId ?? '',

    EmpreendimentoId: os.emprdId ?? os.EmpreendimentoId ?? '',
    EmpreendimentoIntervencao: os.emprdintervencaoId ?? '',

    Classificacao: os.classifCod ?? os.ClassificacaoId ?? '',
    TipoOs: os.tpServCod ?? os.TipoServicoId ?? '',
    CausaIntervencao: os.causasId ?? os.CausasId ?? '',

  ColaboradorId:
  os.MotoristaOperadorId && os.MotoristaOperadorId.length === 36
    ? os.MotoristaOperadorId
    : os.ColaboradorId && os.ColaboradorId.length === 36
      ? os.ColaboradorId
      : '',
    ManutentorResponsavelId: os.manutentorId ?? os.ManutentorResponsavelId ?? '',

    DataAbertura: os.osDataAbertura ?? os.DataAbertura ?? null,
    DataFechamento: os.osDataConclusao ?? os.DataFechamento ?? null,

    Odometro: os.odometro ?? '',
    Horimetro: os.horimetro ?? '',

    DefeitosConstatados: os.obsDef ?? '',
    CausasProvaveis: os.obsCausas ?? '',
    Observacao: os.observacao ?? '',

    Status: this.statusCodigo ?? 1

  });

this.ordemService.gravarOrdem(payloadCompleto).subscribe({

          next: () => {

            this.toast('Foto enviada e status preservado.', 'success');

            this.router.navigate(
              ['/tabs/ordem-servico-pesquisa'],
              {
                queryParams: { highlightOs: this.osCod },
                replaceUrl: true
              }
            );

          },

          error: (err) => {
            this.toast(this.getErrorMessage(err), 'danger');
          }

        });

      },

      error: (err) => {
        this.toast(this.getErrorMessage(err), 'danger');
      }

    });

  },

  error: (err) => {
    this.toast(this.getErrorMessage(err), 'danger');
  }

});
 }
}


