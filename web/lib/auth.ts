import bcrypt from 'bcryptjs';

export function validatePassword(password: string): { isValid: boolean; message?: string } {
    if (password.length < 8) {
        return { isValid: false, message: 'Password harus minimal 8 karakter' };
    }
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, message: 'Password harus mengandung setidaknya satu huruf kapital' };
    }
    if (!/[a-z]/.test(password)) {
        return { isValid: false, message: 'Password harus mengandung setidaknya satu huruf kecil' };
    }
    if (!/[0-9]/.test(password)) {
        return { isValid: false, message: 'Password harus mengandung setidaknya satu angka' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return { isValid: false, message: 'Password harus mengandung setidaknya satu simbol' };
    }
    return { isValid: true };
}

export async function hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
}

