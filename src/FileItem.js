import { getRequestHeaders } from '../../../../../script.js';
import { POPUP_RESULT, POPUP_TYPE, Popup } from '../../../../popup.js';

export class FileItem {
    /**@type {string} */ parentPath;
    /**@type {string} */ parentUrl;
    /**@type {string} */ path;
    /**@type {string} */ type;
    /**@type {string} */ fileType;
    /**@type {string} */ fileTypeFull;
    /**@type {number} */ size;
    /**@type {number} */ modified;

    get extension() {
        return this.path.split('.').pop();
    }


    async open() {
        const response = await fetch(`/api/plugins/files/${this.type == 'file' ? 'open' : 'reveal'}`, {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify({
                path: [this.parentPath, this.path].join('/'),
            }),
        });
        if (!response.ok) {
            alert('Something went wrong');
            return;
        }
    }

    async view() {
        const dom = document.createElement('div'); {
            dom.classList.add('stfe--view');
            switch (this.fileType) {
                case 'text': {
                    const response = await fetch('/api/plugins/files/get', {
                        method: 'POST',
                        headers: getRequestHeaders(),
                        body: JSON.stringify({
                            path: [this.parentPath, this.path].join('/'),
                        }),
                    });
                    if (!response.ok) {
                        alert('Something went wrong');
                        return;
                    }
                    const txt = document.createElement('div'); {
                        txt.classList.add('stfe--txt');
                        txt.textContent = await response.text();
                        dom.append(txt);
                    }
                    break;
                }
                case 'image': {
                    const img = document.createElement('img'); {
                        img.classList.add('stfe--img');
                        img.src = [this.parentUrl, this.path].join('/');
                        dom.append(img);
                        break;
                    }
                }
                case 'video': {
                    const vid = document.createElement('video'); {
                        vid.classList.add('stfe--vid');
                        vid.controls = true;
                        vid.autoplay = true;
                        vid.src = [this.parentUrl, this.path].join('/');
                        dom.append(vid);
                        break;
                    }
                }
                case 'application': {
                    switch (this.fileTypeFull) {
                        case 'application/json': {
                            const response = await fetch('/api/plugins/files/get', {
                                method: 'POST',
                                headers: getRequestHeaders(),
                                body: JSON.stringify({
                                    path: [this.parentPath, this.path].join('/'),
                                }),
                            });
                            if (!response.ok) {
                                alert('Something went wrong');
                                return;
                            }
                            const txt = document.createElement('div'); {
                                txt.classList.add('stfe--code');
                                txt.textContent = JSON.stringify(JSON.parse(await response.text()), null, 2);
                                dom.append(txt);
                            }
                            break;
                        }
                        default: {
                            dom.textContent = 'Cannot do that.';
                            break;
                        }
                    }
                    break;
                }
                default: {
                    dom.textContent = 'Cannot do that.';
                    break;
                }
            }
        }
        const dlg = new Popup(dom, POPUP_TYPE.TEXT, null, {
            okButton: 'Close',
            wide: false,
            large: false,
        });
        // (dlg.dom ?? dlg.dlg).style.zIndex = window.getComputedStyle(this.popup.dom ?? this.popup.dlg).getPropertyValue('z-index');
        await dlg.show();
    }

    async rename() {
        const dlg = new Popup('⚠️ Renaming files can break stuff.', POPUP_TYPE.INPUT, this.path);
        await dlg.show();
        if (dlg.result == POPUP_RESULT.AFFIRMATIVE) {
            const response = await fetch('/api/plugins/files/rename', {
                method: 'POST',
                headers: getRequestHeaders(),
                body: JSON.stringify({
                    path: [this.parentPath, this.path].join('/'),
                    newName: dlg.value,
                }),
            });
            if (!response.ok) {
                alert('Something went wrong');
                return;
            }
            return true;
        }
    }

    async delete() {
        const dlg = new Popup(`⚠️ Deleting files can break stuff.<br>Are you sure you want to delete <code>${this.path}</code>?`, POPUP_TYPE.CONFIRM);
        await dlg.show();
        if (dlg.result == POPUP_RESULT.AFFIRMATIVE) {
            const response = await fetch('/api/plugins/files/delete', {
                method: 'POST',
                headers: getRequestHeaders(),
                body: JSON.stringify({
                    path: [this.parentPath, this.path].join('/'),
                }),
            });
            if (!response.ok) {
                alert('Something went wrong');
                return;
            }
            return true;
        }
    }
}
