import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:glyph/components/pressable.dart';
import 'package:glyph/components/svg_icon.dart';
import 'package:glyph/themes/colors.dart';

class DefaultShell extends StatelessWidget {
  const DefaultShell({
    super.key,
    required this.title,
    required this.child,
    this.actions,
  });

  final String title;
  final Widget child;
  final List<Widget>? actions;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: BrandColors.gray_0,
      appBar: AppBar(
        leading: AutoLeadingButton(
          builder: (context, leadingType, action) {
            if (leadingType == LeadingType.noLeading) {
              return const SizedBox.shrink();
            }

            return Pressable(
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: SvgIcon(
                  switch (leadingType) {
                    LeadingType.back => 'chevron-left',
                    LeadingType.close => 'x',
                    _ => throw UnimplementedError(),
                  },
                  color: BrandColors.gray_600,
                  size: 10,
                ),
              ),
              onPressed: () => action?.call(),
            );
          },
        ),
        title: Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        actions: actions,
        toolbarHeight: 48,
        backgroundColor: BrandColors.gray_0,
        scrolledUnderElevation: 0,
      ),
      body: child,
    );
  }
}
