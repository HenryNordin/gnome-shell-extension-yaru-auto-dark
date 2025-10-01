import Gio from 'gi://Gio';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

export default class DarkModeThemeExtension extends Extension {
    enable() {
        // Manage GNOME Shell theme
        this._userThemeSettings = new Gio.Settings({
            schema_id: 'org.gnome.shell.extensions.user-theme'
        });

        // Manage icon and GTK theme
        this._interfaceSettings = new Gio.Settings({
            schema_id: 'org.gnome.desktop.interface'
        });

        // Apply the appropriate theme immediately based on current dark mode setting
        this._updateTheme();

        // Connect to changes in the color-scheme
        this._colorSchemeChangedId = this._interfaceSettings.connect(
            'changed::color-scheme',
            () => this._updateTheme()
        );
    }

    disable() {
        // Disconnect signal
        if (this._interfaceSettings && this._colorSchemeChangedId) {
            this._interfaceSettings.disconnect(this._colorSchemeChangedId);
        }

        this._userThemeSettings = null;
        this._interfaceSettings = null;
    }

    _updateTheme() {
        // 0 = default/light, 1 = prefer dark
        const darkMode = this._interfaceSettings.get_enum('color-scheme') === 1;

        // Update shell theme dynamically
        let shellTheme = this._userThemeSettings.get_string('name');
        if (!shellTheme) shellTheme = 'Adwaita';
        this._userThemeSettings.set_string('name', this._getVariant(shellTheme, darkMode));

        // Update GTK and icon themes dynamically
        const gtkTheme = this._interfaceSettings.get_string('gtk-theme');
        if (gtkTheme) {
            this._interfaceSettings.set_string('gtk-theme', this._getVariant(gtkTheme, darkMode));
        }

        const iconTheme = this._interfaceSettings.get_string('icon-theme');
        if (iconTheme) {
            this._interfaceSettings.set_string('icon-theme', this._getVariant(iconTheme, darkMode));
        }
    }

    /**
     * Generate the dark or light variant of a theme by appending or removing '-dark'.
     * This works with Yaru or any theme following the '*-dark' naming convention.
     */
    _getVariant(themeName, darkMode) {
        if (darkMode) {
            if (!themeName.toLowerCase().endsWith('-dark')) {
                return `${themeName}-dark`;
            }
        } else {
            return themeName.replace(/-dark$/i, '');
        }
        return themeName;
    }
}
