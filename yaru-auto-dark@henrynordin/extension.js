import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
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
            this._colorSchemeChangedId = null;
        }

        this._userThemeSettings = null;
        this._interfaceSettings = null;
    }

    /**
     * Apply the appropriate theme variants based on the current dark mode setting.
     */
    _updateTheme() {
        // 0 = default/light, 1 = prefer dark
        const darkMode = this._interfaceSettings.get_enum('color-scheme') === 1;

        // Update shell theme dynamically
        let shellTheme = this._userThemeSettings.get_string('name');
        if (!shellTheme) shellTheme = 'Adwaita';
        this._userThemeSettings.set_string(
            'name',
            this._getVariant(shellTheme, darkMode, 'shell')
        );

        // Update GTK theme dynamically
        const gtkTheme = this._interfaceSettings.get_string('gtk-theme');
        if (gtkTheme) {
            this._interfaceSettings.set_string(
                'gtk-theme',
                this._getVariant(gtkTheme, darkMode, 'gtk')
            );
        }

        // Update icon theme dynamically
        const iconTheme = this._interfaceSettings.get_string('icon-theme');
        if (iconTheme) {
            this._interfaceSettings.set_string(
                'icon-theme',
                this._getVariant(iconTheme, darkMode, 'icon')
            );
        }
    }

    /**
     * Generate the dark or light variant of a theme by appending or removing '-dark'.
     * @param {string} themeName - The base name of the theme (e.g., "Adwaita").
     * @param {boolean} darkMode - True if dark mode is enabled, false otherwise.
     * @param {string} type - Type of theme: 'gtk', 'shell', or 'icon'.
     * @returns {string} - The name of the theme variant to apply.
     */
    _getVariant(themeName, darkMode, type) {
        let candidate = themeName;

        if (darkMode) {
            if (!themeName.toLowerCase().endsWith('-dark')) {
                candidate = `${themeName}-dark`;
            }
        } else {
            candidate = themeName.replace(/-dark$/i, '');
        }

        // Only return the candidate if it actually exists for the given type
        if (this._themeExists(candidate, type)) {
            return candidate;
        }

        // Fallback to current theme variant
        return themeName;
    }

    /**
     * Check if a given theme exists on disk for the specified type.
     * @param {string} themeName - Name of the theme to check.
     * @param {string} type - Theme-type, whether it is 'gtk', 'shell', or 'icon'.
     * @returns {boolean} - True if the theme exists, otherwise false.
     */
    _themeExists(themeName, type) {
        let themeDirs = [];

        // Determine which directories to search based on theme type
        if (type === 'gtk' || type === 'shell') {
            themeDirs = [
                GLib.get_home_dir() + '/.themes',
                '/usr/share/themes',
                '/usr/local/share/themes'
            ];
        } else if (type === 'icon') {
            themeDirs = [
                GLib.get_home_dir() + '/.icons',
                '/usr/share/icons',
                '/usr/local/share/icons'
            ];
        }

        // Loop through each directory to check whether the theme exists
        for (let dir of themeDirs) {
            let themePath = Gio.File.new_for_path(`${dir}/${themeName}`);

            // Shell themes must contain 'gnome-shell' subdirectory
            if (type === 'shell') {
                themePath = themePath.get_child('gnome-shell');
            }

            // Check if the file or directory exists
            if (themePath.query_exists(null)) {
                return true;
            }
        }

        // No theme was found
        return false;
    }
}