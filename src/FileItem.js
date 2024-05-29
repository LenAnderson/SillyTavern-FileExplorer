export class FileItem {
    /**@type {string} */ path;
    /**@type {string} */ type;
    /**@type {string} */ fileType;
    /**@type {string} */ fileTypeFull;
    /**@type {number} */ size;
    /**@type {number} */ modified;

    get extension() {
        return this.path.split('.').pop();
    }
}
