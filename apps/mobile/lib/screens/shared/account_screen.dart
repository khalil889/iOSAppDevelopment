import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/config.dart';
import '../../core/locale_controller.dart';
import '../../core/session.dart';
import '../../models/models.dart';
import '../../l10n/l10n.dart';
import '../../widgets/common.dart';
import '../auth/otp_sheet.dart';
import '../auth/require_sign_in.dart';

class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final session = context.watch<Session>();
    final user = session.user;
    final l10n = context.l10n;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.tabAccount)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (user == null)
            EmptyView(
              icon: Icons.person_outline,
              message: l10n.accountSignedOutMessage,
              action: FilledButton(onPressed: () => requireSignIn(context), child: Text(l10n.accountSignInOrRegister)),
            )
          else ...[
            ListTile(
              leading: Avatar(name: user.fullName),
              title: Text(user.fullName),
              subtitle: Text(bidiLtr(user.email ?? '')),
              trailing: StatusChip(user.role == UserRole.guide ? l10n.accountGuideMode : l10n.accountTouristMode),
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.phone_iphone),
              title: Text(user.phone == null ? l10n.accountNoPhone : bidiLtr(user.phone!)),
              subtitle: Text(user.phoneVerified ? l10n.accountPhoneVerified : l10n.accountPhoneNotVerified),
              trailing: user.phoneVerified || user.phone == null
                  ? const Icon(Icons.verified, color: Colors.green)
                  : TextButton(
                      onPressed: () async {
                        final ok = await showOtpSheet(context, phone: user.phone!, login: false);
                        if (ok && context.mounted) showMessage(context, context.l10n.accountPhoneVerifiedToast);
                      },
                      child: Text(l10n.accountVerify),
                    ),
            ),
            ListTile(
              leading: const Icon(Icons.logout),
              title: Text(l10n.accountSignOut),
              onTap: () => context.read<Session>().signOut(),
            ),
            ListTile(
              leading: const Icon(Icons.devices_other),
              title: Text(l10n.accountSignOutAll),
              subtitle: Text(l10n.accountSignOutAllHint),
              onTap: () async {
                final ok = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: Text(l10n.accountSignOutAllTitle),
                    content: Text(l10n.accountSignOutAllBody),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(l10n.cancel)),
                      FilledButton(onPressed: () => Navigator.pop(ctx, true), child: Text(l10n.accountSignOut)),
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
          const Divider(),
          const _LanguageTile(),
          const SizedBox(height: 32),
          Text(l10n.accountApiUrl(bidiLtr(AppConfig.apiUrl)), textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}

class _LanguageTile extends StatelessWidget {
  const _LanguageTile();

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final controller = context.watch<LocaleController>();
    final choice = controller.override?.languageCode ?? 'system';
    final labels = {'system': l10n.languageSystem, 'en': l10n.languageEnglish, 'ar': l10n.languageArabic};
    return ListTile(
      leading: const Icon(Icons.translate),
      title: Text(l10n.language),
      subtitle: Text(labels[choice]!),
      onTap: () async {
        final picked = await showDialog<String>(
          context: context,
          builder: (ctx) => SimpleDialog(
            title: Text(l10n.language),
            children: [
              RadioGroup<String>(
                groupValue: choice,
                onChanged: (v) => Navigator.pop(ctx, v),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    for (final e in labels.entries) RadioListTile<String>(value: e.key, title: Text(e.value)),
                  ],
                ),
              ),
            ],
          ),
        );
        if (picked != null && picked != choice) {
          await controller.choose(picked == 'system' ? null : Locale(picked));
        }
      },
    );
  }
}
