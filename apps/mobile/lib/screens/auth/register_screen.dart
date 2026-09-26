import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/session.dart';
import '../../l10n/l10n.dart';
import '../../models/models.dart';
import '../../services/repository.dart';
import '../../widgets/common.dart';
import 'otp_sheet.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  UserRole _role = UserRole.tourist;
  bool _busy = false;

  @override
  void dispose() {
    for (final c in [_name, _email, _phone, _password]) {
      c.dispose();
    }
    super.dispose();
  }

  String get _normalizedPhone => _phone.text.replaceAll(RegExp(r'[\s-]'), '');

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _busy = true);
    try {
      final repo = context.read<Repository>();
      final res = await repo.register(
        email: _email.text.trim(),
        password: _password.text,
        fullName: _name.text.trim(),
        phone: _normalizedPhone,
        role: _role,
      );
      if (!mounted) return;
      await context.read<Session>().signIn(res);
      if (!mounted) return;
      // Registration already sent a VERIFY_PHONE code; verifying it re-issues the session.
      final verified = await showModalBottomSheet<bool>(
        context: context,
        isScrollControlled: true,
        showDragHandle: true,
        builder: (_) => _VerifyPrompt(phone: _normalizedPhone, devCode: res.devCode),
      );
      if (mounted) {
        if (verified != true) showMessage(context, context.l10n.authVerifyLater);
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.authCreateAccount)),
      body: Form(
        key: _form,
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            SegmentedButton<UserRole>(
              segments: [
                ButtonSegment(value: UserRole.tourist, label: Text(l10n.authRoleTourist), icon: const Icon(Icons.luggage)),
                ButtonSegment(value: UserRole.guide, label: Text(l10n.authRoleGuide), icon: const Icon(Icons.badge)),
              ],
              selected: {_role},
              onSelectionChanged: (s) => setState(() => _role = s.first),
            ),
            if (_role == UserRole.guide)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(l10n.authGuideLicenseNote, style: const TextStyle(fontSize: 12)),
              ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _name,
              decoration: InputDecoration(labelText: l10n.authFullNameLabel),
              validator: (v) => (v ?? '').trim().length < 2 ? l10n.authNameRequired : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              textDirection: TextDirection.ltr,
              decoration: InputDecoration(labelText: l10n.authEmailLabel),
              validator: (v) => (v ?? '').contains('@') ? null : l10n.authEmailInvalid,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _phone,
              keyboardType: TextInputType.phone,
              textDirection: TextDirection.ltr,
              decoration: InputDecoration(
                labelText: l10n.authMobileLabel,
                hintText: '+966500000000',
                hintTextDirection: TextDirection.ltr,
              ),
              validator: (_) => RegExp(r'^\+[1-9]\d{7,14}$').hasMatch(_normalizedPhone)
                  ? null
                  : l10n.authPhoneFormatError(bidiLtr('+966500000000')),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _password,
              obscureText: true,
              textDirection: TextDirection.ltr,
              decoration: InputDecoration(labelText: l10n.authPasswordMinLabel),
              validator: (v) => (v ?? '').length < 8 ? l10n.authPasswordTooShort : null,
            ),
            const SizedBox(height: 24),
            FilledButton(onPressed: _busy ? null : _submit, child: Text(_busy ? l10n.authCreating : l10n.authCreateAccount)),
          ],
        ),
      ),
    );
  }
}

/// Code entry for the VERIFY_PHONE OTP that registration already sent.
class _VerifyPrompt extends StatefulWidget {
  const _VerifyPrompt({required this.phone, this.devCode});
  final String phone;
  final String? devCode;

  @override
  State<_VerifyPrompt> createState() => _VerifyPromptState();
}

class _VerifyPromptState extends State<_VerifyPrompt> {
  late final _code = TextEditingController(text: widget.devCode ?? '');
  String? _error;
  bool _busy = false;

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    setState(() => _busy = true);
    try {
      final res = await context.read<Repository>().verifyOtp(widget.phone, _code.text.trim(), login: false);
      if (!mounted) return;
      await context.read<Session>().signIn(res);
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) setState(() => _error = errorText(context, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Padding(
      padding: EdgeInsetsDirectional.fromSTEB(24, 0, 24, MediaQuery.of(context).viewInsets.bottom + 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(l10n.authVerifyPhoneTitle, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          Text(l10n.authVerifyPhoneBody(bidiLtr(widget.phone))),
          const SizedBox(height: 16),
          TextField(
            controller: _code,
            keyboardType: TextInputType.number,
            maxLength: 6,
            textAlign: TextAlign.center,
            textDirection: TextDirection.ltr,
            style: const TextStyle(fontSize: 24, letterSpacing: 8),
            decoration: InputDecoration(counterText: '', errorText: _error),
          ),
          const SizedBox(height: 12),
          FilledButton(onPressed: _busy ? null : _verify, child: Text(l10n.authVerify)),
          TextButton(
            onPressed: () async {
              final ok = await showOtpSheet(context, phone: widget.phone, login: false);
              if (ok && context.mounted) Navigator.pop(context, true);
            },
            child: Text(l10n.authResendCode),
          ),
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(l10n.authLater)),
        ],
      ),
    );
  }
}
