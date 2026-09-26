import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/config.dart';
import '../../core/session.dart';
import '../../models/models.dart';
import '../../widgets/common.dart';
import '../auth/otp_sheet.dart';
import '../auth/require_sign_in.dart';

class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final session = context.watch<Session>();
    final user = session.user;
    return Scaffold(
      appBar: AppBar(title: const Text('Account')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (user == null)
            EmptyView(
              icon: Icons.person_outline,
              message: 'Sign in to book licensed guides, or create a guide account to offer tours.',
              action: FilledButton(onPressed: () => requireSignIn(context), child: const Text('Sign in or register')),
            )
          else ...[
            ListTile(
              leading: Avatar(name: user.fullName),
              title: Text(user.fullName),
              subtitle: Text(user.email ?? ''),
              trailing: StatusChip(user.role == UserRole.guide ? 'Guide mode' : 'Tourist mode'),
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.phone_iphone),
              title: Text(user.phone ?? 'No phone'),
              subtitle: Text(user.phoneVerified ? 'Verified' : 'Not verified — required to book'),
              trailing: user.phoneVerified || user.phone == null
                  ? const Icon(Icons.verified, color: Colors.green)
                  : TextButton(
                      onPressed: () async {
                        final ok = await showOtpSheet(context, phone: user.phone!, login: false);
                        if (ok && context.mounted) showMessage(context, 'Phone verified');
                      },
                      child: const Text('Verify'),
                    ),
            ),
            ListTile(
              leading: const Icon(Icons.logout),
              title: const Text('Sign out'),
              onTap: () => context.read<Session>().signOut(),
            ),
            ListTile(
              leading: const Icon(Icons.devices_other),
              title: const Text('Sign out of all devices'),
              subtitle: const Text('Use this if you lost a phone'),
              onTap: () async {
                final ok = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Sign out everywhere?'),
                    content: const Text('You will need to sign in again on every device.'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                      FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Sign out')),
                    ],
                  ),
                );
                if (ok == true && context.mounted) {
                  try {
                    await context.read<Session>().signOutEverywhere();
                  } catch (e) {
                    if (context.mounted) showError(context, e);
                  }
                }
              },
            ),
          ],
          const SizedBox(height: 32),
          Text('API: ${AppConfig.apiUrl}', textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}
