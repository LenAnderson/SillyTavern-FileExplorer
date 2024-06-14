import { getRequestHeaders } from '../../../../../script.js';
import { POPUP_RESULT, POPUP_TYPE, Popup } from '../../../../popup.js';
import { humanFileSize } from '../../../../utils.js';
import { waitForFrame } from '../lib/wait.js';
import { FileItem } from './FileItem.js';

export class FileExplorer {
    /**@type {string} */ title;

    /**@type {string[]} */ extensionList;
    /**@type {string[]} */ typeList;

    /**@type {boolean} */ isSingleSelect = true;
    /**@type {boolean} */ isPicker = false;

    mappedList = [
        '~/assets',
        '~/backgrounds',
        '~/characters',
        '~/chats',
        '~/context',
        '~/groups',
        '~/instruct',
        '~/movingUI',
        '~/QuickReplies',
        '~/themes',
        '~/user',
        '~/User Avatars',
        '~/worlds',
    ];
    urlMap = {
    };

    /**@type {string[]} */ path = ['~', 'user'];
    get pathString() { return this.path.join('/'); }
    get pathUrl() { return this.path.slice(1).join('/'); }

    /**@type {string[]} */ #selection = [];
    get selection() {
        if (this.isSingleSelect) return this.#selection.length == 0 ? null : ['', this.pathUrl, this.#selection[0]].join('/');
        return this.#selection.map(it=>['', this.pathUrl, it].join('/'));
    }

    /**@type {Popup} */ popup;
    dom = {
        /**@type {HTMLElement} */
        root: undefined,
        /**@type {HTMLElement} */
        body: undefined,
        /**@type {HTMLElement} */
        crumbs: undefined,
    };

    /**@type {(ClipboardEvent)=>Promise} */ pasteHandlerBound;




    constructor(path = '~') {
        this.path = path.split(/[/\\]/);
    }

    /**
     *
     * @param {ClipboardEvent} evt
     */
    async pasteHandler(evt) {
        if (evt.clipboardData.types.includes('Files') && evt.clipboardData.files?.length > 0) {
            for (const file of evt.clipboardData.files) {
                const reader = new FileReader();
                const prom = new Promise(resolve=>reader.addEventListener('load', resolve));
                reader.readAsDataURL(file);
                await prom;
                const dataUrl = reader.result;
                const response = await fetch('/api/plugins/files/put', {
                    method: 'POST',
                    headers: getRequestHeaders(),
                    body: JSON.stringify({
                        path: `~/user/images/codex/${file.name}`,
                        file: dataUrl,
                    }),
                });
                if (!response.ok) {
                    alert('something went wrong');
                    continue;
                }
            }
            await this.loadDir();
        }
    }


    buildDom() {
        const root = document.createElement('div'); {
            this.dom.root = root;
            root.classList.add('stfe--root');
            root.classList.add('stfe--isLoading');
            const head = document.createElement('div'); {
                head.classList.add('stfe--head');
                const actions = document.createElement('div'); {
                    actions.classList.add('stfe--actions');
                    const up = document.createElement('div'); {
                        up.classList.add('stfe--action');
                        up.classList.add('stfe--up');
                        up.classList.add('menu_button');
                        up.classList.add('fa-solid');
                        up.classList.add('fa-arrow-up');
                        up.title = 'Navigate to parent directory';
                        up.addEventListener('click', ()=>{
                            if (this.path.length > 1) {
                                this.path.pop();
                                this.loadDir();
                            }
                        });
                        actions.append(up);
                    }
                    const reload = document.createElement('div'); {
                        reload.classList.add('stfe--action');
                        reload.classList.add('stfe--reload');
                        reload.classList.add('menu_button');
                        reload.classList.add('fa-solid');
                        reload.classList.add('fa-rotate');
                        reload.title = 'Reload';
                        reload.addEventListener('click', ()=>{
                            this.loadDir();
                        });
                        actions.append(reload);
                    }
                    const upload = document.createElement('div'); {
                        upload.classList.add('stfe--action');
                        upload.classList.add('stfe--upload');
                        upload.classList.add('menu_button');
                        upload.classList.add('fa-solid');
                        upload.classList.add('fa-upload');
                        upload.title = 'Upload files\n---\nOr paste (ctrl+v) to upload from clipboard';
                        upload.addEventListener('click', ()=>{
                            const inp = document.createElement('input'); {
                                inp.type = 'file';
                                inp.multiple = true;
                                inp.addEventListener('change', async(evt)=>{
                                    if (inp.files.length > 0) {
                                        for (const file of inp.files) {
                                            const reader = new FileReader();
                                            const prom = new Promise(resolve=>reader.addEventListener('load', resolve));
                                            reader.readAsDataURL(file);
                                            await prom;
                                            const dataUrl = reader.result;
                                            const response = await fetch('/api/plugins/files/put', {
                                                method: 'POST',
                                                headers: getRequestHeaders(),
                                                body: JSON.stringify({
                                                    path: `~/user/images/codex/${file.name}`,
                                                    file: dataUrl,
                                                }),
                                            });
                                            if (!response.ok) {
                                                alert('something went wrong');
                                                continue;
                                            }
                                        }
                                        inp.value = null;
                                        this.loadDir();
                                    }
                                });
                                inp.click();
                            }
                        });
                        actions.append(upload);
                    }
                    head.append(actions);
                }
                const reveal = document.createElement('div'); {
                    reveal.classList.add('stfe--action');
                    reveal.classList.add('stfe--reveal');
                    reveal.classList.add('menu_button');
                    reveal.classList.add('fa-solid');
                    reveal.classList.add('fa-folder-open');
                    reveal.title = 'Reveal in OS File Explorer';
                    reveal.addEventListener('click', async()=>{
                        const response = await fetch('/api/plugins/files/reveal', {
                            method: 'POST',
                            headers: getRequestHeaders(),
                            body: JSON.stringify({
                                path: this.pathString,
                            }),
                        });
                        if (!response.ok) {
                            alert('Something went wrong');
                            return;
                        }
                    });
                    actions.append(reveal);
                }
                const crumbs = document.createElement('div'); {
                    this.dom.crumbs = crumbs;
                    crumbs.classList.add('stfe--crumbs');
                    crumbs.classList.add('text_pole');
                    crumbs.textContent = this.pathString;
                    head.append(crumbs);
                }
                const size = document.createElement('input'); {
                    size.classList.add('stfe--size');
                    size.type = 'range';
                    size.min = '3';
                    size.max = '20';
                    size.step = '1';
                    size.value = localStorage.getItem('stfe--thumb-size') ?? '10';
                    size.addEventListener('input', ()=>{
                        this.dom.root.style.setProperty('--stfe--thumb-size', size.value);
                        const num = Number(size.value);
                        if (num >= 9) {
                            this.dom.root.style.setProperty('--stfe--name-size', '1em');
                        } else if (num < 9 && num >= 7) {
                            this.dom.root.style.setProperty('--stfe--name-size', 'small');
                        } else if (num < 7) {
                            this.dom.root.style.setProperty('--stfe--name-size', 'smaller');
                        }
                        if (num == 3) {
                            this.dom.root.classList.add('stfe--small');
                        } else {
                            this.dom.root.classList.remove('stfe--small');
                        }
                        localStorage.setItem('stfe--thumb-size', size.value);
                    });
                    size.dispatchEvent(new Event('input', { bubbles:true }));
                    head.append(size);
                }
                root.append(head);
            }
            const body = document.createElement('div'); {
                this.dom.body = body;
                body.classList.add('stfe--body');
                root.append(body);
            }
        }
        const dlg = new Popup(root, POPUP_TYPE.TEXT, null, {
            okButton: this.isPicker ? 'Cancel' : 'Close',
            wide: true,
            large: true,
        });
        this.popup = dlg;
    }


    async show() {
        this.buildDom();
        this.pasteHandlerBound = this.pasteHandler.bind(this);
        this.loadDir();
        window.addEventListener('paste', this.pasteHandlerBound);
        await this.popup.show();
        window.removeEventListener('paste', this.pasteHandlerBound);
    }


    async loadDir() {
        this.#selection = [];
        this.dom.body.innerHTML = '';
        this.dom.root.classList.add('stfe--isLoading');
        const response = await fetch('/api/plugins/files/list', {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify({
                path: this.pathString,
                extensions: this.extensionList,
                types: this.typeList,
            }),
        });
        if (!response.ok) {
            alert('Something went wrong');
            return;
        }
        this.dom.crumbs.textContent = this.pathString;
        const files = /**@type {FileItem[]} */(await response.json())
            .filter(f=>this.mappedList.includes([this.pathString, f.path].join('/')) || this.mappedList.find(it=>[this.pathString, f.path].join('/').startsWith(`${it}/`)))
            .map(f=>(f.parentPath = this.pathString, f.parentUrl = this.pathUrl, Object.assign(new FileItem(), f)))
        ;
        files.sort((a,b)=>{
            if (a.type == 'dir' && b.type != 'dir') return -1;
            if (a.type != 'dir' && b.type == 'dir') return 1;
            return a.path.toLowerCase().localeCompare(b.path.toLowerCase());
        });
        for (const file of files) {
            const item = document.createElement('div'); {
                item.classList.add('stfe--item');
                item.title = [
                    file.path,
                    file.type,
                    file.type == 'file' ? `${file.fileType} (${file.fileTypeFull})` : null,
                    file.type == 'file' ? new Date(file.modified).toLocaleString() : null,
                    file.type == 'file' ? humanFileSize(file.size) : null,
                ].filter(it=>it).join('\n---\n');
                item.addEventListener('click', async()=>{
                    if (file.type == 'dir') {
                        this.path.push(file.path);
                        this.loadDir();
                        return;
                    }
                    if (this.isPicker) {
                        if (this.isSingleSelect) {
                            this.#selection = [file.path];
                            this.popup.completeAffirmative();
                        } else {
                            const sel = item.classList.toggle('stfe--selected');
                            if (sel) {
                                this.#selection.push(file.path);
                            } else {
                                this.#selection.splice(this.#selection.indexOf(file.path));
                            }
                        }
                    } else {
                        await file.view();
                    }
                });
                item.addEventListener('contextmenu', async(evt)=>{
                    evt.preventDefault();
                    evt.stopPropagation();
                    let menu;
                    const blocker = document.createElement('div'); {
                        blocker.classList.add('stfe--ctx-blocker');
                        blocker.addEventListener('click', ()=>{
                            blocker.remove();
                        });
                        menu = document.createElement('menu'); {
                            menu.classList.add('stfe--ctx-menu');
                            if (file.type == 'file') {
                                const view = document.createElement('li'); {
                                    view.classList.add('stfe--ctx-item');
                                    if (!this.isPicker) view.classList.add('stfe--ctx-default');
                                    view.textContent = 'View';
                                    view.addEventListener('click', async(evt)=>{
                                        blocker.remove();
                                        await file.view();
                                    });
                                    menu.append(view);
                                }
                            }
                            const open = document.createElement('li'); {
                                open.classList.add('stfe--ctx-item');
                                open.textContent = 'Open locally';
                                open.addEventListener('click', async(evt)=>{
                                    blocker.remove();
                                    await file.open();
                                });
                                menu.append(open);
                            }
                            const rename = document.createElement('li'); {
                                rename.classList.add('stfe--ctx-item');
                                rename.textContent = 'Rename...';
                                rename.addEventListener('click', async(evt)=>{
                                    blocker.remove();
                                    if (await file.rename()) {
                                        await this.loadDir();
                                    }
                                });
                                menu.append(rename);
                            }
                            const del = document.createElement('li'); {
                                del.classList.add('stfe--ctx-item');
                                del.textContent = 'Delete...';
                                del.addEventListener('click', async(evt)=>{
                                    blocker.remove();
                                    if (await file.delete()) {
                                        await this.loadDir();
                                    }
                                });
                                menu.append(del);
                            }
                            blocker.append(menu);
                        }
                        this.dom.root.closest('dialog, body').append(blocker);
                    }
                    await waitForFrame();
                    const rect = menu.getBoundingClientRect();
                    const layer = this.dom.root.closest('dialog, body').getBoundingClientRect();
                    const x = evt.clientX - layer.left;
                    const y = evt.clientY - layer.top;
                    if (x + rect.width < window.innerWidth) {
                        menu.style.left = `${x}px`;
                    } else {
                        menu.style.right = `${x}px`;
                    }
                    if (y + rect.height < window.innerHeight) {
                        menu.style.top = `${y}px`;
                    } else {
                        menu.style.bottom = `${y}px`;
                    }
                });
                if (file.fileType == 'image') {
                    const img = document.createElement('img'); {
                        img.classList.add('stfe--thumb');
                        img.src = `/api/plugins/files/thumb?path=${encodeURIComponent([this.pathString, file.path].join('/'))}&w=100&h=100`;
                        item.append(img);
                        const mo = new MutationObserver(muts=>{
                            img.src = `/api/plugins/files/thumb?path=${encodeURIComponent([this.pathString, file.path].join('/'))}&w=${img.offsetWidth}&h=${img.offsetHeight}`;
                        });
                        mo.observe(this.dom.root, { attributes:true, attributeFilter:['style'] });
                        const moRemove = new MutationObserver(muts=>{
                            for (const mut of muts) {
                                if ([...mut.removedNodes].find(node=>node == img || node.contains(img))) {
                                    mo.disconnect();
                                    moRemove.disconnect();
                                    console.log('[STFE]', 'MO DISCONNECT', img);
                                    return;
                                }
                            }
                        });
                        moRemove.observe(this.dom.root, { subtree:true, childList:true });
                    }
                } else if (file.type == 'file') {
                    const icon = document.createElement('div'); {
                        icon.classList.add('stfe--icon');
                        icon.classList.add('fa-solid');
                        switch (file.fileType) {
                            case 'video': {
                                icon.classList.add('fa-file-video');
                                break;
                            }
                            case 'text': {
                                icon.classList.add('fa-file-text');
                                break;
                            }
                            default: {
                                icon.classList.add('fa-file');
                                break;
                            }
                        }
                        item.append(icon);
                    }
                } else {
                    const icon = document.createElement('div'); {
                        icon.classList.add('stfe--icon');
                        icon.classList.add('fa-solid');
                        icon.classList.add('fa-folder');
                        item.append(icon);
                    }
                }
                const name = document.createElement('div'); {
                    name.classList.add('stfe--name');
                    name.textContent = file.path;
                    item.append(name);
                }
                this.dom.body.append(item);
            }
        }
        this.dom.root.classList.remove('stfe--isLoading');
    }
}
