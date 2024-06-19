/* eslint-disable camelcase */
/**
 *
 * LoginSocialGoogle
 *
 */

import { createEffect, createSignal, onMount } from 'solid-js';
import { AuthPayload, AuthResponse } from './models';

interface Props {
	appId: string;
	scope?: string;
	state?: boolean;
	xfbml?: boolean;
	cookie?: boolean;
	version?: string;
	language?: string;
	auth_type?: string;
	isDisabled?: boolean;
	isOnlyGetToken?: boolean;
	onLoginStart?: () => void;
	onLogoutSuccess?: () => void;
	onReject: (reject: string | AuthPayload) => void;
	onResolve: ({ provider, payload }: AuthResponse) => void;
	redirect_uri?: string;
	fieldsProfile?: string;
	response_type?: string;
	return_scopes?: boolean;
	children?: Node;
}

const SDK_URL: string = 'https://connect.facebook.net/en_EN/sdk.js';
const SCRIPT_ID: string = 'facebook-jssdk';
const _window = window as any;

export default function LoginSocialFacebook({
	appId,
	scope = 'email,public_profile',
	state = true,
	xfbml = true,
	cookie = true,
	version = 'v2.7',
	language = 'en_EN',
	auth_type = '',
	onLoginStart,
	onReject,
	onResolve,
	redirect_uri,
	fieldsProfile = 'id,first_name,last_name,middle_name,name,name_format,picture,short_name,email,gender',
	response_type = 'code',
	return_scopes = true,
	isOnlyGetToken = false,
	children,
}: Props) {
	let scriptNode: HTMLScriptElement | undefined;
	const [isSdkLoaded, setIsSdkLoaded] = createSignal(false);
	const [isProcessing, setIsProcessing] = createSignal(false);

	createEffect(() => {
		isSdkLoaded() && load();
	});

	onMount(() => {
		return () => {
			scriptNode && scriptNode.remove();
		};
	});

	const insertSDKScript = (document: Document, cb: () => void) => {
		const fbScriptTag = document.createElement('script');
		fbScriptTag.id = SCRIPT_ID;
		fbScriptTag.src = SDK_URL;
		const scriptNode = document.getElementsByTagName('script')![0];
		scriptNode &&
			scriptNode.parentNode &&
			scriptNode.parentNode.insertBefore(fbScriptTag, scriptNode);
		cb();
	};

	const checkIsExistsSDKScript = () => {
		return !!document.getElementById(SCRIPT_ID);
	};

	const initFbSDK = (config: AuthPayload, document: HTMLDocument) => {
		const _window = window as any;
		_window.fbAsyncInit = function () {
			_window.FB && _window.FB.init({ ...config });
			setIsSdkLoaded(true);
			let fbRoot = document.getElementById('fb-root');
			if (!fbRoot) {
				fbRoot = document.createElement('div');
				fbRoot.id = 'fb-root';
				document.body.appendChild(fbRoot);
			}
			scriptNode = fbRoot as HTMLScriptElement;
		};
	};

	const getMe = (authResponse: AuthPayload) => {
		_window.FB.api(
			'/me',
			{ locale: language, fields: fieldsProfile },
			(me: any) => {
				onResolve({
					provider: 'facebook',
					payload: { ...authResponse, ...me },
				});
			}
		);
	};

	const handleResponse = (response: AuthPayload) => {
		if (response.authResponse) {
			if (isOnlyGetToken)
				onResolve({
					provider: 'facebook',
					payload: { ...response.authResponse },
				});
			else getMe(response.authResponse);
		} else {
			onReject(response);
		}
		setIsProcessing(false);
	};

	const load = () => {
		if (checkIsExistsSDKScript()) {
			setIsSdkLoaded(true);
		} else {
			insertSDKScript(document, () => {
				initFbSDK(
					{
						appId,
						xfbml,
						version,
						state,
						cookie,
						redirect_uri,
						response_type,
					},
					document
				);
			});
		}
	};

	const loginFB = () => {
		if (!isSdkLoaded || isProcessing()) return;

		if (!_window.FB) {
			load();
			onReject("Fb isn't loaded!");
			setIsProcessing(false);
		} else {
			setIsProcessing(true);
			onLoginStart && onLoginStart();
			_window.FB.login(handleResponse, {
				scope,
				return_scopes,
				auth_type,
			});
		}
	};

	return <div onClick={loginFB}>{children}</div>;
}
