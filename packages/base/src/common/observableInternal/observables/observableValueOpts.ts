/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import type { ISettableObservable } from '../base.js';
import type { EqualityComparer } from '../commonFacade/deps.js';
import { strictEquals } from '../commonFacade/deps.js';
import { DebugLocation } from '../debugLocation.js';
import type { IDebugNameData } from '../debugName.js';
import { DebugNameData } from '../debugName.js';
import { LazyObservableValue } from './lazyObservableValue.js';
import { ObservableValue } from './observableValue.js';

export function observableValueOpts<T, TChange = void>(
    options: IDebugNameData & {
        equalsFn?: EqualityComparer<T>;
        lazy?: boolean;
    },
    initialValue: T,
    debugLocation = DebugLocation.ofCaller(),
): ISettableObservable<T, TChange> {
    if (options.lazy) {
        return new LazyObservableValue(
            new DebugNameData(options.owner, options.debugName, undefined),
            initialValue,
            options.equalsFn ?? strictEquals,
            debugLocation,
        );
    }
    return new ObservableValue(
        new DebugNameData(options.owner, options.debugName, undefined),
        initialValue,
        options.equalsFn ?? strictEquals,
        debugLocation,
    );
}
