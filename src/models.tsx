export type AuthPayload = {
	[key: string]: any;
};

export type AuthResponse = {
	provider: string;
	payload?: AuthPayload;
};
