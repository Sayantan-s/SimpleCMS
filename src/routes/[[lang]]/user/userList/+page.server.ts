import { fail, type Actions } from '@sveltejs/kit';
import { auth } from '$lib/server/lucia';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { LuciaError } from 'lucia-auth';
import { User } from '$lib/models/user-model';
import { SignUpToken } from '$lib/models/sign-up-token-model';
import { randomBytes } from 'crypto';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.validate();
	if (!session) throw redirect(302, '/');
	return {};
};

export const actions: Actions = {
	generateToken: async ({ request, locals }) => {
		const form = await request.formData();

		const email = form.get('newUserEmail');
		const role = form.get('role'); //TO-DO set role on form

		console.log({ email: email, role: role });

		const tokenTable = await SignUpToken.count();
		const user = await User.findOne({ email: email });

		console.log({ dt: user });

		if (tokenTable === 0) {
			await SignUpToken.createCollection();
		}

		if (user) {
			return fail(400, {
				type: 'SIGN_UP_ERROR' as const,
				message: 'Email already in use'
			});
		}

		await SignUpToken.insertMany({
			email: email,
			role: role,
			resetRequestedAt: new Date(),
			resetToken: randomBytes(16).toString('base64')
		});
	}
};