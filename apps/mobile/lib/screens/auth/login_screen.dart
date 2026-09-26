import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/session.dart';
import '../../l10n/l10n.dart';
import '../../services/repository.dart';
import '../../widgets/common.dart';
import 'otp_sheet.dart';
import 'register_screen.dart';

/// Sign in with email + password or with a phone OTP.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _phone = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _emailLogin() async {
    setState(() => _busy = true);
    try {
      final res = await context.read<Repository>().login(_email.text.trim(), _password.text);
      if (!mounted) return;
      await context.read<Session>().signIn(res);
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _phoneLogin() async {
    final phone = _phone.text.replaceAll(RegExp(r'[\s-]'), '');
    final ok = await showOtpSheet(context, phone: phone, login: true);
    if (ok && mounted) Navigator.pop(context, true);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: Text(l10n.authSignInTitle),
          bottom: TabBar(tabs: [Tab(text: l10n.authTabEmail), Tab(text: l10n.authTabPhone)]),
        ),
        body: TabBarView(
          children: [
            ListView(
              padding: const EdgeInsets.all(24),
              children: [
                TextField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  autofillHints: const [AutofillHints.email],
                  textDirection: TextDirection.ltr,
                  decoration: InputDecoration(labelText: l10n.authEmailLabel),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _password,
                  obscureText: true,
                  autofillHints: const [AutofillHints.password],
                  textDirection: TextDirection.ltr,
                  decoration: InputDecoration(labelText: l10n.authPasswordLabel),
                  onSubmitted: (_) => _emailLogin(),
                ),
                const SizedBox(height: 20),
                FilledButton(onPressed: _busy ? null : _emailLogin, child: Text(_busy ? l10n.authSigningIn : l10n.authSignInButton)),
                const SizedBox(height: 8),
                Text(
                  l10n.authDemoHint(bidiLtr('sara@example.com'), bidiLtr('faisal@guides.test'), bidiLtr('Password123!')),
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 12),
                ),
              ],
            ),
            ListView(
              padding: const EdgeInsets.all(24),
              children: [
                TextField(
                  controller: _phone,
                  keyboardType: TextInputType.phone,
                  textDirection: TextDirection.ltr,
                  decoration: InputDecoration(
                    labelText: l10n.authPhoneLabel,
                    hintText: '+966 50 000 0000',
                    hintTextDirection: TextDirection.ltr,
                  ),
                ),
                const SizedBox(height: 20),
                FilledButton(onPressed: _phoneLogin, child: Text(l10n.authSendCode)),
              ],
            ),
          ],
        ),
        bottomNavigationBar: SafeArea(
          child: TextButton(
            onPressed: () async {
              final ok = await Navigator.push<bool>(context, MaterialPageRoute(builder: (_) => const RegisterScreen()));
              if (ok == true && context.mounted) Navigator.pop(context, true);
            },
            child: Text(l10n.authCreateAccountPrompt),
          ),
        ),
      ),
    );
  }
}
