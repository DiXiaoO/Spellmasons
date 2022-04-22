export function set(key: string, value: any) {
    if (window.allowCookies) {
        localStorage.setItem(key, value);
        console.log('Setting ', key, 'to', value, 'in local storage');
    } else {
        console.log(`Could not save "${key}" to storage, without cookie consent`);
    }
}
export function assign(key: string, value: object) {
    if (window.allowCookies) {
        const obj = localStorage.getItem(key);
        let json = {};
        if (obj) {
            json = JSON.parse(obj);
        }
        console.log('Changing ', value, 'in', key, 'in local storage');
        const options = JSON.stringify(Object.assign(json, value))
        localStorage.setItem(key, options);
    } else {
        console.log(`Could not add "${key}" to storage, without cookie consent`);
    }
}
export function get(key: string): string | null {
    if (window.allowCookies) {
        return localStorage.getItem(key);
    } else {
        console.log(`Could not retrieve "${key}" from storage, without cookie consent`);
        return null;
    }

}