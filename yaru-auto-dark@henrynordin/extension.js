import Gio from 'gi://Gio';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

export default class DarkModeThemeExtension extends Extension {
    enable() {
        // Create GSettings object to manage the user's GNOME Shell theme
        this._userThemeSettings = new Gio.Settings({
            schema_id: 'org.gnome.shell.extensions.user-theme'
        });

        // Create GSettings object to read interface settings, such as dark mode preference
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

        const theme = darkMode ? 'Yaru-dark' : 'Yaru';
        this._userThemeSettings.set_string('name', theme);
    }
}