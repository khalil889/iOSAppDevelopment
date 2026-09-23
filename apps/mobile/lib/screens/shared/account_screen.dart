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
          ],
          const SizedBox(height: 32),
          Text('API: ${AppConfig.apiUrl}', textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}
