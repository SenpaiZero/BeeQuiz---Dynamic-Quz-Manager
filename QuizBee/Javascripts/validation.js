export const fullNameRegex = /^[A-Za-z]+( [A-Za-z]+)+$/;
export const emailRegex = /^[\w\d._]{4,}@[A-Za-z\d]{2,}\.[A-Za-z\d.]+$/;
export const usernameRegex = /^[A-Za-z0-9_]+$/;
export const numberOnlyRegex = /^[0-9]+$/;

export function isValidFullName(fullName) {
    return fullNameRegex.test(fullName);
}

export function isValidEmail(email) {
    return emailRegex.test(email);
}

export function isValidUsername(username) {
    return usernameRegex.test(username);
}

export function isNumberOnly(number) {
    return numberOnlyRegex.test(number);
}