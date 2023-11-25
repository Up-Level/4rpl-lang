use std::{fs, path, path::{Path, PathBuf}, time::{Instant, Duration}, error::Error, process};
use clap::Parser;
use xrpl_parser::tokeniser;

#[derive(Parser)]
struct Cli {
    source_path: path::PathBuf,
    out_path: path::PathBuf
}

fn main() {
    /*let cli = Cli {
        source_path: PathBuf::from("test/aaTest.4rpl"),
        out_path: PathBuf::from("test-out/aaTest.4rpl")
    };*/

    let cli = Cli::parse();

    if !Path::exists(&cli.source_path) {
        eprintln!("Error: Source path does not exist.");
        process::exit(1);
    }

    println!("Tokenising...");

    let out = run(cli);
    match out {
        Ok(count) => println!("Successfully parsed {count} file(s)."),
        Err(error) => {
            eprintln!("Error: {error}");
            process::exit(1);
        }
    };
}

fn run(cli: Cli) -> Result<usize, Box<dyn Error>> {
    if cli.source_path.is_dir() {
        let mut total_time = Duration::new(0, 0);
        let mut file_count = 0;

        let files = fs::read_dir(cli.source_path)?
            .filter(|file| file.as_ref().unwrap().path().is_file());

        for file in files {
            let source_path = &file?.path();

            if source_path.extension().unwrap() != "4rpl" {continue}

            let out_path = Path::new(&cli.out_path).join(source_path.file_name().ok_or("_.4rpl")?);

            let time_taken = parse_and_write(source_path, &out_path)?;

            total_time += time_taken;
            println!("\t{:?} in {:.2?}.", source_path.file_name().unwrap(), time_taken);

            file_count += 1;
        }

        println!("Total time taken: {:.2?}.", total_time);

        Ok(file_count)
    }
    else {
        let time_taken = parse_and_write(&cli.source_path, &cli.out_path)?;
        println!("\t{:?} in {:.2?}.", cli.source_path.file_name().unwrap(), time_taken);

        Ok(1)
    }
}

fn parse_and_write(source_path: &PathBuf, out_path: &PathBuf) -> Result<Duration, Box<dyn Error>> {
    let document: String = fs::read_to_string(source_path)?;

    /*let errors = xrpl_parser::validate::validate(&document);
    for error in errors {
        println!("{:?}", error);
    }
    return Ok(Duration::new(0, 0));*/

    let now = Instant::now();
    let tokens = tokeniser::parse(&document);
    /*for _ in 0..10000 {
        tokens = tokeniser::parse(&document);
    }*/

    let elapsed = now.elapsed();
    
    fs::write(out_path, tokens.join(" "))?;

    Ok(elapsed)
}
