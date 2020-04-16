// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import ToolsHost from "../toolsHost";

declare var InspectorFrontendHost: ToolsHost;

interface IRevealable {
    lineNumber: number;
    columnNumber: number;
    uiSourceCode: {
        _url: string;
    };
}

export function revealInVSCode(revealable: IRevealable | undefined, omitFocus: boolean) {
    if (revealable && revealable.uiSourceCode && revealable.uiSourceCode._url) {
        InspectorFrontendHost.openInEditor(
            revealable.uiSourceCode._url,
            revealable.lineNumber,
            revealable.columnNumber,
            omitFocus,
        );
    }

    return Promise.resolve();
}

export function applyCommonRevealerPatch(content: string) {
    const pattern = /let reveal\s*=\s*function\(revealable,\s*omitFocus\)\s*{/g;
    if (content.match(pattern)) {
        return content.replace(pattern,
            `let reveal = ${revealInVSCode.toString().slice(0, -1)}`);
    } else {
        return null;
    }
}

export function applyInspectorViewHandleActionPatch(content: string) {
    const pattern = /handleAction\(context,\s*actionId\)\s*{/g;

    if (content.match(pattern)) {
        return content
        .replace(pattern, "handleAction(context, actionId) { return false;");
    } else {
        return null;
    }
}

export function applyInspectorViewShowDrawerPatch(content: string) {
    const pattern = /_showDrawer\(focus\)\s*{/g;

    if (content.match(pattern)) {
        return content.replace(pattern, "_showDrawer(focus) { return false;");
    } else {
        return null;
    }
}

export function applyMainViewPatch(content: string) {
    const pattern = /const moreTools\s*=\s*[^;]+;/g;

    if (content.match(pattern)) {
        return content.replace(pattern, "const moreTools = { defaultSection: () => ({ appendItem: () => {} }) };");
    } else {
        return null;
    }
}

export function applyShowElementsTab(content: string) {
  const pattern = /this\._defaultTab\s*=\s*defaultTab;/;

  if (content.match(pattern)) {
    return content.replace(pattern, "this._defaultTab = 'elements';");
  } else {
    return null;
  }
}

export function applyAppendTabPatch(content: string) {
    const allowedTabs = [
        "elements",
        "Styles",
        "Computed",
        "accessibility.view",
        "elements.domProperties",
        "elements.domBreakpoints",
        "elements.eventListeners",
        "network",
        "network.blocked-urls",
        "network.search-network-tab",
        "headers",
        "preview",
        "response",
        "timing",
        "initiator",
        "cookies",
        "eventSource",
        "webSocketFrames",
        "preferences",
        "workspace",
        "experiments",
        "blackbox",
        "devices",
        "throttling-conditions",
        "emulation-geolocations",
        "Shortcuts",
    ];

    const condition = allowedTabs.map((tab) => {
        return `id !== '${tab}'`;
    }).join(" && ");

    const pattern = /appendTab\(id,\s*tabTitle\s*,\s*view,\s*tabTooltip,\s*userGesture,\s*isCloseable,\s*index\)\s*{/;

    if (content.match(pattern)) {
        return content.replace(
            pattern,
            `appendTab(id, tabTitle, view, tabTooltip, userGesture, isCloseable, index) { if (${condition}) return;`);
    } else {
        return null;
    }
}

export function applyDrawerTabLocationPatch(content: string) {
    const pattern = /this._showDrawer.bind\s*\(this,\s*false\),\s*'drawer-view',\s*true,\s*true/g;
    if (content.match(pattern)) {
        return content.replace(pattern,
            `this._showDrawer.bind\(this, false\), 'drawer-view', true, true, 'network.blocked-urls'`);
    } else {
        return null;
    }
}

export function applyMainTabTabLocationPatch(content: string) {
    const pattern = /InspectorFrontendHostInstance\),\s*'panel',\s*true,\s*true,\s*Root.Runtime.queryParam\('panel'\)/g;
    if (content.match(pattern)) {
        return content.replace(pattern, `InspectorFrontendHostInstance\), 'panel', true, true, 'network'`);
    } else {
        return null;
    }
}

export function applyInspectorCommonCssPatch(content: string, isRelease?: boolean) {
    const separator = (isRelease ? "\\n" : "\n");

    const hideInspectBtn =
        `.toolbar-button[aria-label='Select an element in the page to inspect it'] {
            display: none !important;
        }`.replace(/\n/g, separator);

    const unHideScreenCastBtn =
        `.toolbar-button[aria-label='Toggle screencast'] {
            visibility: visible !important;
        }`.replace(/\n/g, separator);

    const unHideSearchCloseButton =
        `.toolbar-button[aria-label='Close'] {
            visibility: visible !important;
        }`.replace(/\n/g, separator);

    const topHeaderCSS =
        hideInspectBtn +
        unHideScreenCastBtn +
        unHideSearchCloseButton;

    const hideMoreToolsBtn =
        `.toolbar-button[aria-label='More Tools'] {
            display: none !important;
        }`.replace(/\n/g, separator);

    const drawerCSS = hideMoreToolsBtn;

    const hideExportHarBtn =
        `.toolbar-button[aria-label='Export HAR...'] {
            display: none !important;
        }`.replace(/\n/g, separator);

    const hidePrettyPrintBtn =
        `.toolbar-button[aria-label='Pretty print'] {
            display: none !important;
        }`.replace(/\n/g, separator);

    const hideSomeContextMenuItems =
        `.soft-context-menu-separator,
        .soft-context-menu-item[aria-label='Open in new tab'],
        .soft-context-menu-item[aria-label='Open in Sources panel'],
        .soft-context-menu-item[aria-label='Clear browser cache'],
        .soft-context-menu-item[aria-label='Clear browser cookies'],
        .soft-context-menu-item[aria-label='Save all as HAR with content'],
        .soft-context-menu-item[aria-label='Save as...'] {
            display: none !important;
        }`.replace(/\n/g, separator);

    const networkCSS =
        hideExportHarBtn +
        hidePrettyPrintBtn +
        hideSomeContextMenuItems;

    const addCSS =
        topHeaderCSS +
        drawerCSS +
        networkCSS;

    const pattern = /(:host-context\(\.platform-mac\)\s*\.monospace,)/g;
    if (content.match(pattern)) {
        return content.replace(pattern, `${addCSS}${separator} $1`);
    } else {
        return null;
    }
}

export function applyInspectorCommonCssHeaderContentsPatch(content: string, isRelease?: boolean) {
    const separator = (isRelease ? "\\n" : "\n");
    const cssHeaderContents =
        `.main-tabbed-pane .tabbed-pane-header-contents {
            display: none !important;
        }`.replace(/\n/g, separator);

    const mainPattern = /(\.main-tabbed-pane\s*\.tabbed-pane-header-contents\s*\{([^\}]*)?\})/g;

    if (content.match(mainPattern)) {
        return content.replace(
            mainPattern,
            cssHeaderContents);
    } else {
        return null;
    }
}

export function applyInspectorCommonCssRightToolbarPatch(content: string, isRelease?: boolean) {
    const separator = (isRelease ? "\\n" : "\n");
    const cssRightToolbar =
        `.tabbed-pane-right-toolbar {
            visibility: hidden !important;
        }`.replace(/\n/g, separator);

    const tabbedPanePattern = /(\.tabbed-pane-right-toolbar\s*\{([^\}]*)?\})/g;

    if (content.match(tabbedPanePattern)) {
        return content.replace(
                tabbedPanePattern,
                cssRightToolbar);
    } else {
        return null;
    }
}

export function applyInspectorCommonCssTabSliderPatch(content: string, isRelease?: boolean) {
    const separator = (isRelease ? "\\n" : "\n");
    const cssTabSlider =
        `.tabbed-pane-tab-slider {
            display: none !important;
        }`.replace(/\n/g, separator);

    const tabbedPaneSlider = /(\.tabbed-pane-tab-slider\s*\{([^\}]*)?\})/g;

    if (content.match(tabbedPaneSlider)) {
        return content.replace(
            tabbedPaneSlider,
            cssTabSlider);
    } else {
        return null;
    }
}
