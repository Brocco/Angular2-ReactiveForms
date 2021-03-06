import { Component, OnInit, AfterViewInit, OnDestroy, ViewChildren, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, FormControlName, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/observable/merge';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { IProduct } from './product';
import { ProductService } from './product.service';

import { NumberValidators } from '../shared/number.validator';
import { GenericValidator } from '../shared/generic-validator';

@Component({
    templateUrl: './app/products/product-edit.component.html'
})
export class ProductEditComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChildren(FormControlName, { read: ElementRef }) formControls: ElementRef[];

    pageTitle: string = 'Product Edit';
    product: IProduct;
    errorMessage: string;
    private sub: Subscription;

    productForm: FormGroup;
    displayMessage: { [key: string]: string } = {};
    private validationMessages: { [key: string]: { [key: string]: string } };
    genericValidator: GenericValidator;

    constructor(private fb: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private _productService: ProductService) {

        this.validationMessages = {
            productName: {
                required: 'Product name is required',
                minlength: 'Product name must be at least three characters.',
                maxlength: 'Product name cannot exceed 50 characters.'
            },
            productCode: {
                required: 'Product code is required'
            },
            starRating: {
                range: 'Rate the product between 1 (lowest) and 5 (highest).'
            }
        };

        this.genericValidator = new GenericValidator(this.validationMessages);

    }

    ngOnInit(): void {
        this.sub = this.route.params.subscribe(
            params => {
                let id = +params['id'];
                this.getProduct(id);
            }
        );

        this.productForm = this.fb.group({
            productName: ['', [Validators.required,
                               Validators.minLength(3),
                               Validators.maxLength(50)]],
            productCode: ['', Validators.required],
            starRating: ['', NumberValidators.range(1, 5)],
            tags: this.buildTagArray(),
            description: ''
        });
    }

    ngAfterViewInit(): void {
        let controlBlurs: Observable<any>[] = this.formControls
            .map((formControl: ElementRef) => Observable.fromEvent(formControl.nativeElement, 'blur'));

        Observable.merge(this.productForm.valueChanges, ...controlBlurs).debounceTime(800).subscribe(value => {
            this.displayMessage = this.genericValidator.processMessages(this.productForm);
        });
    }

    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }

    get tags(): FormArray {
        return <FormArray>this.productForm.get('tags');
    }

    getProduct(id: number): void {
        this._productService.getProduct(id)
            .subscribe(
            (product: IProduct) => this.onProductRetrieved(product),
            (error: any) => this.errorMessage = <any>error);
    }

    onProductRetrieved(product: IProduct): void {
        if (this.productForm) {
            this.productForm.reset();
        }
        this.product = product;

        if (this.product.productId === 0) {
            this.pageTitle = 'Add Product';
        } else {
            this.pageTitle = `Edit Product: ${this.product.productName}`;
        }

        // Update the data on the form
        this.productForm.patchValue({
            productName: this.product.productName,
            productCode: this.product.productCode,
            starRating: this.product.starRating,
            description: this.product.description
        });
        this.productForm.setControl('tags', this.buildTagArray());
    }

    addTag(defaultValue: string): void {
        this.tags.push(this.buildTag(defaultValue));
    }

    buildTag(defaultValue: string): FormControl {
        return new FormControl(defaultValue);
    }

    buildTagArray(): FormArray {
        if (this.product && this.product.tags) {
            return this.fb.array(this.product.tags.map((tag) => {
                return new FormControl(tag);
            }));
        } else {
            return new FormArray([]);
        }
    }

    saveProduct() {
        if (this.productForm.dirty && this.productForm.valid) {
            this.product = this.productForm.value;
            alert(`Movie: ${JSON.stringify(this.productForm.value)}`);
        }
    }
}
