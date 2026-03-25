import { create } from 'zustand';
import { getProfile, setProfile as saveProfileToStorage } from './profile.store';

export const useProfileStore = create((set) => ({
    profile: getProfile(),
    setProfile: (profile) => {
        saveProfileToStorage(profile);
        set({ profile });
    },
    refreshProfile: () => {
        set({ profile: getProfile() });
    }
}));
