import type { Resource } from '@inlang/fluent-ast';
import type { InlangConfig } from '@inlang/config';
import { converters, parseResources } from '@inlang/fluent-format-converters';
import path from 'path';
import { Result } from '@inlang/result';
import { CommonFsApi } from '../types/commonFsApi';

/**
 * Reads and parses the local translation files to `Resources`.
 *
 * @args
 * `directory` the path from where the relative `pathPattern` should be resolved
 *
 *
 */
export async function readResources(args: {
    fs: CommonFsApi;
    directory: string;
    languageCodes: InlangConfig['latest']['languageCodes'];
    pathPattern: InlangConfig['latest']['pathPattern'];
    fileFormat: InlangConfig['latest']['fileFormat'];
}): Promise<Result<Record<string, Resource | undefined>, Error>> {
    const converter = converters[args.fileFormat];
    const localFiles = [];
    for (const languageCode of args.languageCodes) {
        // named with underscore to avoid name clashing with the imported path module
        const _path = path.resolve(args.directory, args.pathPattern.replace('{languageCode}', languageCode));
        const decoder = new TextDecoder();
        try {
            // https://stackoverflow.com/a/44640785/16690118
            const readFile = decoder.decode(await args.fs.readFile(_path));
            localFiles.push({
                data: readFile,
                languageCode: languageCode,
            });
        } catch {
            continue;
        }
    }
    return parseResources({
        converter: converter,
        files: localFiles,
    });
}
