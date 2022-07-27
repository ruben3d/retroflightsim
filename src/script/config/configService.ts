import { assertExpr, assertIsDefined } from "../utils/asserts";
import { TechProfile } from "./profiles/profile";

export type ConfigServiceListener = (profile: TechProfile, newId: string, oldId: string) => void;

export class ConfigService {

    activeProfile: string;
    profiles: Map<string, TechProfile> = new Map();
    listeners: Set<ConfigServiceListener> = new Set();

    constructor(profiles: { [id: string]: TechProfile }) {
        this.profiles = new Map(Object.entries(profiles));
        assertExpr(this.profiles.size > 0);
        this.activeProfile = Object.keys(profiles)[0];
    }

    setActiveProfile(id: string) {
        if (id === this.activeProfile) return;
        assertExpr(this.profiles.has(id));

        const oldId = this.activeProfile;
        this.activeProfile = id;
        const profile = this.getProfile();
        for (const l of this.listeners.values()) {
            l(profile, id, oldId);
        }
    }

    getProfile(): TechProfile {
        const profile = this.profiles.get(this.activeProfile);
        assertIsDefined(profile);
        return profile;
    }

    addChangeListener(listener: ConfigServiceListener) {
        this.listeners.add(listener);
    }

    removeChangeListener(listener: ConfigServiceListener) {
        this.listeners.delete(listener);
    }
}
