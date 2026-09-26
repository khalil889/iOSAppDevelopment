import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/session.dart';
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
        if (verified != true) showMessage(context, 'You can verify your phone later from Account.');
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
    return Scaffold(
      appBar: AppBar(title: const Text('Create account')),
      body: Form(
        key: _form,
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            SegmentedButton<UserRole>(
              segments: const [
                ButtonSegment(value: UserRole.tourist, label: Text("I'm travelling"), icon: Icon(Icons.luggage)),
                ButtonSegment(value: UserRole.guide, label: Text("I'm a guide"), icon: Icon(Icons.badge)),
              ],
              selected: {_role},
              onSelectionChanged: (s) => setState(() => _role = s.first),
            ),
            if (_role == UserRole.guide)
              const Padding(
                padding: EdgeInsets.only(top: 8),
                child: Text(
                  'After sign-up, submit your tourism license from the dashboard. You can receive bookings once an admin verifies it.',
                  style: TextStyle(fontSize: 12),
                ),
              ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _name,
              decoration: const InputDecoration(labelText: 'Full name'),
              validator: (v) => (v ?? '').trim().length < 2 ? 'Enter your name' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Email'),
              validator: (v) => (v ?? '').contains('@') ? null : 'Enter a valid email',
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _phone,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Mobile number', hintText: '+966500000000'),
              validator: (_) => RegExp(r'^\+[1-9]\d{7,14}$').hasMatch(_normalizedPhone)
                  ? null
                  : 'Use international format, e.g. +966500000000',
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _password,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Password (min 8 characters)'),
              validator: (v) => (v ?? '').length < 8 ? 'At least 8 characters' : null,
            ),
            const SizedBox(height: 24),
            FilledButton(onPressed: _busy ? null : _submit, child: Text(_busy ? 'Creating…' : 'Create account')),
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
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(24, 0, 24, MediaQuery.of(context).viewInsets.bottom + 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Verify your phone', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          Text('Enter the code sent to ${widget.phone}. A verified phone is required to book.'),
          const SizedBox(height: 16),
          TextField(
            controller: _code,
            keyboardType: TextInputType.number,
            maxLength: 6,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 24, letterSpacing: 8),
            decoration: InputDecoration(counterText: '', errorText: _error),
          ),
          const SizedBox(height: 12),
          FilledButton(onPressed: _busy ? null : _verify, child: const Text('Verify')),
          TextButton(
            onPressed: () async {
              final ok = await showOtpSheet(context, phone: widget.phone, login: false);
              if (ok && context.mounted) Navigator.pop(context, true);
            },
            child: const Text('Resend code'),
          ),
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Later')),
        ],
      ),
    );
  }
}
