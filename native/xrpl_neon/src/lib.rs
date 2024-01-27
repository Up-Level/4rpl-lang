use neon::prelude::*;

use xrpl_parser::{tokeniser,validate};

fn parse(mut ctx: FunctionContext) -> JsResult<JsArray> {
    let document = ctx.argument::<JsString>(0)?.value(&mut ctx);

    let tokens = tokeniser::parse(&document);

    let out = JsArray::new(&mut ctx, tokens.len() as u32);

    for (i, token) in tokens.iter().enumerate() {
        let token_js = ctx.empty_object();
        let value = ctx.string(&token.value);
        let position = ctx.number(token.position as f64);

        token_js.set(&mut ctx, "value", value)?;
        token_js.set(&mut ctx, "position", position)?;

        out.set(&mut ctx, i as u32, token_js)?;
    };

    Ok(out)
}

fn validate(mut ctx: FunctionContext) -> JsResult<JsArray> {
    let document = ctx.argument::<JsString>(0)?.value(&mut ctx);

    let errors = validate::validate(&document);

    let out = JsArray::new(&mut ctx, errors.len() as u32);

    for (i, error) in errors.iter().enumerate() {
        let error_js = ctx.empty_object();
        let message = ctx.string(&error.message);
        let start = ctx.number(error.start as f64);
        let end = ctx.number(error.end as f64);

        error_js.set(&mut ctx, "message", message)?;
        error_js.set(&mut ctx, "start", start)?;
        error_js.set(&mut ctx, "end", end)?;

        out.set(&mut ctx, i as u32, error_js)?;
    };

    Ok(out)
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("parse", parse)?;
    cx.export_function("validate", validate)?;
    Ok(())
}
