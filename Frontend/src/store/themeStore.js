import { create } from 'zustand';

export const themes = [
    'dark', 
    'light', 
    'cyberpunk', 
    'ocean', 
    'sunset', 
    'forest', 
    'dracula', 
    'matrix'
];

export const themeNameMap = {
    'dark': 'Dark Mode',
    'light': 'Light Mode',
    'cyberpunk': 'Cyberpunk',
    'ocean': 'Ocean Deep',
    'sunset': 'Sunset Horizon',
    'forest': 'Emerald Forest',
    'dracula': 'Dracula',
    'matrix': 'The Matrix'
};

const useThemeStore = create((set) => ({
    themeIndex: 0,
    currentTheme: themes[0],
    
    cycleTheme: () => set((state) => {
        const nextIndex = (state.themeIndex + 1) % themes.length;
        const nextTheme = themes[nextIndex];
        
        // Optional: Apply it globally to the body element so it can affect the whole app
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${nextTheme}`);
        
        return {
            themeIndex: nextIndex,
            currentTheme: nextTheme
        };
    }),
    
    setTheme: (themeName) => set((state) => {
        const index = themes.indexOf(themeName);
        if (index === -1) return state;
        
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${themeName}`);
        
        return {
            themeIndex: index,
            currentTheme: themeName
        };
    })
}));

export default useThemeStore;
