import { guard as globalGuard } from '../../globalCore';
import { isGuildCommandContext } from './isGuildCommandContext';
import { isPrivateCommandContext } from './isPrivateCommandContext';
import { isAliasedCustomCommand } from './isAliasedCustomCommand';

export const guard = {
    ...globalGuard,
    isGuildCommandContext,
    isPrivateCommandContext,
    isAliasedCustomCommand
};