import { POPUP_RESULT } from '../../../popup.js';
import { SlashCommand } from '../../../slash-commands/SlashCommand.js';
import { ARGUMENT_TYPE, SlashCommandArgument, SlashCommandNamedArgument } from '../../../slash-commands/SlashCommandArgument.js';
import { SlashCommandParser } from '../../../slash-commands/SlashCommandParser.js';
import { FileExplorer } from './src/FileExplorer.js';

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'explorer',
    callback: async(args, value)=>{
        const fe = new FileExplorer(value || '~');
        fe.typeList = JSON.parse(args.types ?? 'null');
        fe.extensionList = JSON.parse(args.ext ?? 'null');
        await fe.show();
        if (fe.popup.result == POPUP_RESULT.AFFIRMATIVE && fe.selection) {
            return fe.selection;
        }
        return '';
    },
    returns: 'the selected file',
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'types',
            description: 'list of types to includes, e.g. ["image", "image/jpeg", "text/plain"]',
            typeList: [ARGUMENT_TYPE.LIST],
        }),
        SlashCommandNamedArgument.fromProps({ name: 'ext',
            description: 'list of extensions to includes, e.g. ["jpg", "png", "pdf", "txt"]',
            typeList: [ARGUMENT_TYPE.LIST],
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'initial directory',
            typeList: [ARGUMENT_TYPE.STRING],
            defaultValue: '~',
        }),
    ],
    helpString: 'Show the File Explorer.',
}));
