# SillyTavern File Explorer

File Explorer to browse and pick files from SillyTavern directories.

```stscript
/explorer types=["image","text"] ext=["png","jpg","txt"] ~/user/images
```

```javascript
import { FileExplorer } from '../SillyTavern-FileExplorer/src/FileExplorer.js';

const fe = new FileExplorer('~/user/images');
fe.typeList = ['image', 'text'];
fe.extensionList = ['png', 'jpg', 'txt'];
await fe.show();
console.log(fe.selection);
```




## Requirements
- [SillyTavern Files Plugin](https://github.com/LenAnderson/SillyTavern-Files)
