import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/session.dart';
import '../../l10n/l10n.dart';
import '../../services/repository.dart';
import '../../widgets/common.dart';

/// Requests an OTP for [phone], collects the 6-digit code and signs in.
/// Resolves to true on success.
Future<bool> showOtpSheet(BuildContext context, {required String phone, required bool login}) async {
  final repo = context.read<Repository>();
  String? devCode;
  try {
    devCode = await repo.requestOtp(phone, login: login);
  } catch (e) {
    if (context.mounted) showError(context, e);
    return false;
  }
  if (!context.mounted) return false;
  final ok = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => _OtpSheet(phone: phone, login: login, devCode: devCode),
  );
  return ok == true;
}

class _OtpSheet extends StatefulWidget {
  const _OtpSheet({required this.phone, required this.login, this.devCode});
  final String phone;
  final bool login;
  final String? devCode;

  @override
  State<_OtpSheet> createState() => _OtpSheetState();
}

class _OtpSheetState extends State<_OtpSheet> {
  final _code = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    // Dev convenience: the API echoes the code when OTP_DEV_ECHO=true.
    if (widget.devCode != null) _code.text = widget.devCode!;
  }

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final res = await context.read<Repository>().verifyOtp(widget.phone, _code.text.trim(), login: widget.login);
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
          Text(l10n.authEnterCodeTitle, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          Text(l10n.authCodeSentTo(bidiLtr(widget.phone))),
          if (widget.devCode != null)
            Text(l10n.authDevCodePrefilled, style: TextStyle(color: Theme.of(context).hintColor, fontSize: 12)),
          const SizedBox(height: 16),
          TextField(
            controller: _code,
            keyboardType: TextInputType.number,
            maxLength: 6,
            autofocus: true,
            textAlign: TextAlign.center,
            textDirection: TextDirection.ltr,
            style: const TextStyle(fontSize: 24, letterSpacing: 8),
            decoration: InputDecoration(counterText: '', errorText: _error),
            onSubmitted: (_) => _verify(),
          ),
          const SizedBox(height: 16),
          FilledButton(onPressed: _busy ? null : _verify, child: Text(_busy ? l10n.authVerifying : l10n.authVerify)),
        ],
      ),
    );
  }
}
