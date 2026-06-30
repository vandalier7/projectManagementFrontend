export const getTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light';
};

export const setTheme = (theme: 'light' | 'dark'): void => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
};

export const initTheme = (): void => {
    const theme = getTheme();
    document.documentElement.classList.toggle('dark', theme === 'dark');
};