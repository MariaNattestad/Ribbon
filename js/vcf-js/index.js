function parseBreakend(breakendString) {
    const tokens = breakendString.split(/[[\]]/);
    if (tokens.length > 1) {
        const MateDirection = breakendString.includes('[') ? 'right' : 'left';
        let Join;
        let Replacement;
        let MatePosition;
        for (let i = 0; i < tokens.length; i += 1) {
            const tok = tokens[i];
            if (tok) {
                if (tok.includes(':')) {
                    // this is the remote location
                    MatePosition = tok;
                    Join = Replacement ? 'right' : 'left';
                }
                else {
                    // this is the local alteration
                    Replacement = tok;
                }
            }
        }
        if (!(MatePosition && Join && Replacement)) {
            throw new Error(`Invalid breakend: ${breakendString}`);
        }
        return { MatePosition, Join, Replacement, MateDirection };
    }
    else {
        if (breakendString.startsWith('.')) {
            return {
                Join: 'left',
                SingleBreakend: true,
                Replacement: breakendString.slice(1),
            };
        }
        else if (breakendString.endsWith('.')) {
            return {
                Join: 'right',
                SingleBreakend: true,
                Replacement: breakendString.slice(0, breakendString.length - 1),
            };
        }
        else if (breakendString[0] === '<') {
            const res = breakendString.match('<(.*)>(.*)');
            if (!res) {
                throw new Error(`failed to parse ${breakendString}`);
            }
            const Replacement = res === null || res === void 0 ? void 0 : res[2];
            return Replacement
                ? {
                    Join: 'left',
                    Replacement,
                    MateDirection: 'right',
                    MatePosition: `<${res === null || res === void 0 ? void 0 : res[1]}>:1`,
                }
                : undefined;
        }
        else if (breakendString.includes('<')) {
            const res = breakendString.match('(.*)<(.*)>');
            if (!res) {
                throw new Error(`failed to parse ${breakendString}`);
            }
            const Replacement = res === null || res === void 0 ? void 0 : res[1];
            return Replacement
                ? {
                    Join: 'right',
                    Replacement,
                    MateDirection: 'right',
                    MatePosition: `<${res === null || res === void 0 ? void 0 : res[2]}>:1`,
                }
                : undefined;
        }
    }
    return undefined;
}
